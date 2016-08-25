#!/bin/python
import sys
from vdsm.config import config
from vdsm import jsonrpcvdscli
import json
import xml.dom.minidom
import argparse
import requests
import logging
import copy
import random

LOG_FILE_NAME='/var/log/vdsm/cockpit-ovirt.log'

def _set_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    logger.propagate = False

    fh = logging.FileHandler(LOG_FILE_NAME)
    fh.setLevel(logging.DEBUG)
    debug_fmt = logging.Formatter("%(asctime)s %(message)s", "%m/%d/%Y %I:%M:%S %p")

    ih = logging.StreamHandler(stream=sys.stdout)
    ih.setLevel(logging.INFO)
    info_fmt = logging.Formatter("%(message)s", "%m/%d/%Y %I:%M:%S %p")

    fh.setFormatter(debug_fmt)
    ih.setFormatter(info_fmt)

    logger.addHandler(fh)
    logger.addHandler(ih)

    logging.captureWarnings(True)

    return logger


def ensure_jsonrpcvdscli_compatibility():
    # vdsmapi-schema.json
    # jsonrpcvdscli.py
    jsonrpcvdscli._COMMAND_CONVERTER['shutdown'] = 'VM.shutdown'


_service=None
def get_vdsm_service():
    global _service
    if _service is None:
        rqueues = config.get('addresses', 'request_queues')
        rqueue = rqueues.split(',', 1)[0]
        _service = jsonrpcvdscli.connect(rqueue)

    return _service


def read_stdin():
    inData = sys.stdin.readline()
    line = ''
    while line:
        inData += line
        line = sys.stdin.readline()
    return inData


def build_result(code, message, content=None):
    logger.debug('build_result, code: {0}, message: "{1}", content: {2}'.format(code, message, content is not None))
    result = {'status' : {
        'code': code,
        'message': message
        },
        'content':content
    }
    return result


# invoke engine REST API
# TODO: use SSL certificates
def http_call(url, method, headers = {'Accept': 'application/json'}, user=None, pwd=None, body=None, verify=False):
    logger.debug("http_call: '{0}',\n  method:{1}, user:{2}, headers:{3}".format(url, method, user, headers))

    if method not in ['GET', 'POST']:
        logger.info('Unsupported method: {0}'.format(method));
        return None

    auth=None
    if user:
        auth=(user, pwd)

    if method=='GET':
        result = requests.get(url,auth=auth, headers=headers, verify=verify)

    if method=='POST':
        result = requests.post(url,auth=auth, headers=headers, verify=verify, data=body)

    logger.debug('http_call status_code: {0}'.format(result.status_code))
    return result


def get_engine_token():
    logger.debug('get_engine_token() called')
    credentials = read_credentials()

    url = "{0}/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api".format(credentials['url'])
    resp = http_call(url=url, method='GET', user=credentials['user'], pwd=credentials['pwd'])
    if resp.status_code == 200:
        content = json.loads(resp.text)
        if 'access_token' in content:
            return build_result(0, 'Done', content)
        else:
            return build_result(1, content['error_code'], content['error'])
    else:
        return build_result(resp.status_code, resp.text)


def read_credentials():
    logger.debug('Reading token data from stdin');
    si=read_stdin()
    try:
        credentials = json.loads(si)
        tolog = credentials.copy()
        if 'pwd' in tolog:
            tolog["pwd"] = "******"
        logger.debug('credentials read from stdin: %s', tolog)
        return credentials
    except json.JSONDecodeError:
        logger.warn("Failed to parse credentials, invalid input data: %s", si)
        return None


def get_default_headers(credentials):
    headers = {'Accept': 'application/json', 'Authorization': "Bearer {0}".format(credentials['token'])}
    return headers


def get_default_post_headers(credentials):
    headers = {'Content-Type': 'application/xml', 'Authorization': "Bearer {0}".format(credentials['token'])}
    return headers


def get_all_vms():
    logger.debug('get_all_vms() called')
    credentials = read_credentials()

    url = "{0}/api/{1}".format(credentials['url'], 'vms')
    resp = http_call(url=url, method='GET', headers=get_default_headers(credentials))
    if resp.status_code == 200:
        content = json.loads(resp.text)
        # TODO: prune data before transfer
        # TODO: should related sub-data be loaded now?
        return build_result(0, 'Done', content)
    else:
        return build_result(resp.status_code, resp.text)


def get_host(hostId):
    logger.debug('get_host() called')
    credentials = read_credentials()

    url = "{0}/api/{1}/{2}".format(credentials['url'], 'hosts', hostId)
    resp = http_call(url=url, method='GET', headers=get_default_headers(credentials))
    if resp.status_code == 200:
        content = json.loads(resp.text)
        return build_result(0, 'Done', content)
    else:
        return build_result(resp.status_code, resp.text)


def get_running_host(credentials=None):
    logger.debug('get_running_host() called')

    if credentials is None:
        credentials = read_credentials()

    with open('/etc/vdsm/vdsm.id', 'r') as myfile:
        vdsmId=myfile.read().replace('\n', '')
    logger.debug("VDSM ID read: {0}".format(vdsmId))

    url = "{0}/api/{1}".format(credentials['url'], 'hosts')
    resp = http_call(url=url, method='GET', headers=get_default_headers(credentials))
    if resp.status_code == 200:
        content = json.loads(resp.text)

        for host in content['host']:
            if host['hardware_information']['uuid'] == vdsmId:
                return build_result(0, 'Done', host)

        return build_result(1, 'Not found', "VDSM ID '{0}' not found in engine's hosts list".format(vdsmId))
    return build_result(resp.status_code, resp.text)


def run_engine_vm(vmId):
    logger.debug("run_engine_vm({0}) called".format(vmId))
    credentials = read_credentials()

    xml_request = "<action/>"

    url = "{0}/api/vms/{1}/start".format(credentials['url'], vmId)
    resp = http_call(url=url, method='POST', headers=get_default_post_headers(credentials), body=xml_request)
    # TODO: refactor error handling and returned data (XML vs. JSON, prune data)
    if resp.status_code == 200:
        content_xml = resp.text
        return build_result(0, 'Done', content_xml)
    else:
        return build_result(resp.status_code, resp.text)


def host_to_maintenance():
    logger.debug('host_to_maintenance() called')
    credentials = read_credentials()

    host = get_running_host(credentials)

    if host['status']['code'] != 0:
        return host

    xml_request = "<action/>"

    url = "{0}/api/hosts/{1}/deactivate".format(credentials['url'], host['content']['id'])
    resp = http_call(url=url, method='POST', headers=get_default_post_headers(credentials), body=xml_request)
    if resp.status_code == 200:
        content_xml = resp.text
        return build_result(0, 'Done', content_xml)
    else:
        return build_result(resp.status_code, resp.text)


def restart_vm(vmId):
    logger.debug("restart_vm({0}) called".format(vmId))
    return get_vdsm_service().shutdown(vmId, reboot=True)


def fake_vm(src, offset):
    fake = copy.deepcopy(src)

    fake['vmName'] = "fake {0} - {1}".format(offset, fake['vmName'])

    strOffset = "f{0:05d}".format(offset)
    fake['vmId'] = strOffset + fake['vmId'][len(strOffset):]

    fake['cpuUser'] = random.randint(0,60)
    fake['cpuSys'] = random.randint(0,40)

    MB = 1024 * 1024

    if fake['disks']:
        diskName = fake['disks'].keys()[0]
        disk = fake['disks'][diskName]
        disk['readRate'] = random.randint(MB,MB*60)
        disk['writeRate'] = random.randint(MB,MB*60)

    if fake['network']:
        netName = fake['network'].keys()[0]
        net = fake['network'][netName]
        net['rxRate'] = random.randint(MB,MB*60)
        net['txRate'] = random.randint(MB,MB*60)

    logger.debug("Fake VM created: vmName: '{0}', vmId: '{1}', srcVmId: '{2}'".format(fake['vmName'], fake['vmId'], src['vmId']))
    return fake


def get_all_vm_stats_fake_extend():
    FAKE_VMS_COUNT = 50
    logger.debug('get_all_vm_stats_fake_extend() called')
    result = get_vdsm_service().getAllVmStats()
    if result['items']:
        vm = result['items'][0]
        for offset in range(0, FAKE_VMS_COUNT):
            result['items'].append(fake_vm(vm, offset))
    return result


def parse_args(service):
    parser = argparse.ArgumentParser(description='Support utility for Cockpit oVirt plugin to invoke VDSM JSON RPC or Engine REST API.\n')
    parser.add_argument('vdsmCommand', help='VDSM command to be invoked',
                        choices=['getAllVmStats', 'shutdown', 'destroy', 'restart', 'ping', 'engineBridge', 'getAllVmStatsFakeExtend', 'getVdsCapabilities'])
    parser.add_argument('vdsmCommandArgs', help='VDSM command arguments', nargs='*')
    return parser.parse_args()


def main():
    ensure_jsonrpcvdscli_compatibility()
    service = get_vdsm_service()

    ENGINE_COMMANDS = {
        'getToken': get_engine_token,
        'getAllVms': get_all_vms,
        'getHost': get_host,
        'getRunningHost': get_running_host,
        'hostToMaintenance': host_to_maintenance,
        'runVm': run_engine_vm
    }

    COMMANDS = {
        'getAllVmStats' : service.getAllVmStats,
        'getAllVmStatsFakeExtend' : get_all_vm_stats_fake_extend,
        'shutdown' : service.shutdown,
        'destroy' : service.destroy,
        'restart' : restart_vm,
        'ping' : service.ping,
        'getVdsCapabilities': service.getVdsCapabilities
    }

    args = parse_args(service)
    vdsmCommand = args.vdsmCommand
    vdsmCommandArgs = args.vdsmCommandArgs

    if vdsmCommand == 'engineBridge':
        result = ENGINE_COMMANDS[vdsmCommandArgs[0]](*vdsmCommandArgs[1:])
    else:
        logger.debug("Calling vdsm:" + vdsmCommand)
        result = COMMANDS[vdsmCommand](*vdsmCommandArgs)

    logger.debug('result: ' + json.dumps(result))
    print json.dumps(result)
    return 0


if __name__ == "__main__":
    logger=_set_logger()
    sys.exit(main())
