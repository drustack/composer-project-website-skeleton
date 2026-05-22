#!/bin/bash

set -euxo pipefail

chgrp -Rf 33 /var/www/html
find /var/www/html -type d -exec chmod g+wrxs {} \;
find /var/www/html -type f -exec chmod g+wr {} \;
chown -Rf 999:999 /var/lib/mysql
chown -Rf 999:999 /var/lib/postgresql/data
chown -Rf 8983:8983 /var/solr
