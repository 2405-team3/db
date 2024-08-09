#! /bin/bash

echo ""
echo "========= updating / upgrading packages"

sudo apt update
sudo apt upgrade -y

echo ""
echo "========= install nginx"

sudo apt -y install nginx

echo ""
echo "========= installing pyenv"

curl https://pyenv.run | bash

echo 'export PYENV_ROOT="$HOME/.pyenv"' >>~/.profile
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >>~/.profile
echo 'eval "$(pyenv init -)"' >>~/.profile

source ~/.profile

echo ""
echo "========= installing build dependencies for python"

sudo apt -y install build-essential libssl-dev zlib1g-dev \
	libbz2-dev libreadline-dev libsqlite3-dev curl \
	libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

echo ""
echo "========= installing python 3.10.12"

pyenv install -v 3.10.12
pyenv global 3.10.12

echo ""
echo "========= installing pipenv"

pip install pipenv

source ~/.profile
