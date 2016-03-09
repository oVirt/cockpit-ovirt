#!/bin/python
import sys
from vdsm.config import config
from vdsm import jsonrpcvdscli
import json
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

def ensureJsonrpcvdscliCompatibility():
    # vdsmapi-schema.json
    # jsonrpcvdscli.py
    jsonrpcvdscli._COMMAND_CONVERTER['shutdown'] = 'VM.shutdown'


# TODO: Singleton
service=None
def getVDSMService():
    global service
    if not service:
        logger.debug("getVDSMService() connecting ...")
        rqueues = config.get('addresses', 'request_queues')
        rqueue = rqueues.split(',', 1)[0]
        service = jsonrpcvdscli.connect(rqueue)

    return service

def readStdin():
    inData = sys.stdin.readline()
    line = ''
    while line:
        inData += line
        line = sys.stdin.readline()
    return inData

def buildResult(code, message, content):
    result = {'status' : {
        'code': code,
        'message': message
        },
        'content':content
    }
    return result

# invoke engine REST API
# TODO: use certificates
def httpCall(url, method, headers = {'Accept': 'application/json'}, user=None, pwd=None, body=None, verify=False):
    logger.debug("httpCall: '{0}',\n  method:{1}, user:{2}, headers:{3}".format(url, method, user, headers))

    auth=None
    if user:
        auth=(user, pwd)

    if method=='GET':
        return requests.get(url,auth=auth, headers=headers, verify=verify)

    logger.info('Unsupported method: {0}'.format(method));
    return None

def getEngineToken():
    logger.debug('getEngineToken() called')
    credentials = readCredentials()

    url = "{0}/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api".format(credentials['url'])
    resp = httpCall(url=url, method='GET', user=credentials['user'], pwd=credentials['pwd'])
    if resp.status_code == 200:
        content = json.loads(resp.text)
        if 'access_token' in content:
            return buildResult(0, 'Done', content)
        else:
            return buildResult(1, content['error_code'], content['error'])
    else:
        return buildResult(resp.status_code, resp.text)

def readCredentials():
    logger.debug('Reading token data from stdin');
    si=readStdin()
    logger.debug("stdin:{0}".format(si));
    credentials = json.loads(si)
    logger.debug(credentials)
    return credentials

def getDefaultHeaders(credentials):
    headers = {'Accept': 'application/json', 'Authorization': "Bearer {0}".format(credentials['token'])}
    return headers

def getAllVms():
    logger.debug('getAllVms() called')
    credentials = readCredentials()

    url = "{0}/api/{1}".format(credentials['url'], 'vms')
    resp = httpCall(url=url, method='GET', headers=getDefaultHeaders(credentials))
    if resp.status_code == 200:
        content = json.loads(resp.text)
        # TODO: prune data before transfer
        # TODO: should related sub-data be loaded now?
        return buildResult(0, 'Done', content)
    else:
        return buildResult(resp.status_code, resp.text)

def getHost(hostId):
    logger.debug('getHost() called')
    credentials = readCredentials()

    url = "{0}/api/{1}/{2}".format(credentials['url'], 'hosts', hostId)
    resp = httpCall(url=url, method='GET', headers=getDefaultHeaders(credentials))
    if resp.status_code == 200:
        content = json.loads(resp.text)
        return buildResult(0, 'Done', content)
    else:
        return buildResult(resp.status_code, resp.text)

def restartVm(vmId):
    logger.debug("restartVm({0}) called".format(vmId))
    return getVDSMService().shutdown(vmId, reboot=True)

def fakeVm(src, offset):
    fake = copy.deepcopy(src)

    fake['vmName'] = "{0} - fake {1}".format(fake['vmName'], offset)

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

def getAllVmStatsFakeExtend():
    FAKE_VMS_COUNT = 100
    logger.debug('getAllVmStatsFakeExtend() called')
    result = getVDSMService().getAllVmStats()
    if result['items']:
        vm = result['items'][0]
        for offset in range(0, FAKE_VMS_COUNT):
            result['items'].append(fakeVm(vm, offset))
    return result

def parseArgs(service):
    parser = argparse.ArgumentParser(description='Support utility for Cockpit oVirt plugin to invoke VDSM JSON RPC or Engine REST API.\n')
    parser.add_argument('vdsmCommand', help='VDSM command to be invoked',
                        choices=['getAllVmStats', 'shutdown', 'destroy', 'restart', 'ping', 'engineBridge', 'getAllVmStatsFakeExtend'])
    parser.add_argument('vdsmCommandArgs', help='VDSM command arguments', nargs='*')
    return parser.parse_args()

def main():
    ensureJsonrpcvdscliCompatibility()
    service = getVDSMService()

    ENGINE_COMMANDS = {
        'getToken': getEngineToken,
        'getAllVms' : getAllVms,
        'getHost' : getHost
    }

    COMMANDS = {
        'getAllVmStats' : service.getAllVmStats,
        'getAllVmStatsFakeExtend' : getAllVmStatsFakeExtend,
        'shutdown' : service.shutdown,
        'destroy' : service.destroy,
        'restart' : restartVm,
        'ping' : service.ping
    }

    args = parseArgs(service)
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
