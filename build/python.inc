# Copyright 2016 Red Hat, Inc. and/or its affiliates.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

PYTHON_SYNTAX_CHECK_FILES = $(srcdir)/static/*/*.py

python-syntax-check:
if PYTHON_SYNTAX_CHECK
	if [ -n "$(PYFLAKES)" ]; then \
		$(PYFLAKES) $(PYTHON_SYNTAX_CHECK_FILES); \
	fi
	if [ -n "$(PEP8)" ]; then \
		$(PEP8) $(PYTHON_SYNTAX_CHECK_FILES); \
	fi
endif

python-clean:
	rm -rf $(srcdir)/static/*/__pycache__ __pycache__
	rm -f $(srcdir)/static/*/*.pyc $(srcdir)/static/*/*.pyo *.pyc *.pyo
