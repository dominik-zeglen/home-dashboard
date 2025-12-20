# Lab Dashboard

App consist of two components - backend and frontend.

```nginx
server {
    listen 80;
    server_name *host_url*;

    root /var/www/lab-dashboard;
    index index.html;

    location /status {
        proxy_pass http://localhost:18745;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

To upload via sftp you can run the following command:

```sh
$ sftp -b upload.sftp *hostname*
```

To mount it as service put this file in `/etc/systemd/system/dashboard.service`

```
[Unit]
Description=Node health status service
After=network.target

[Service]
ExecStart=/opt/dashboard/venv/bin/python /opt/dashboard/server.py
WorkingDirectory=/opt/dashboard
Restart=always
User=status
Environment=PORT=18745

[Install]
WantedBy=multi-user.target
```

This config assumes virtualenv is created:

```sh
$ cd /opt/dashboard
$ python -m venv venv
```

User running `server.py` needs to be added to following groups

```sh
$ sudo usermod -aG video *user*
$ sudo usermod -aG docker *user*
```

## Environment variables

Dashboard uses the following environment variables to properly function:

- **OPENWEATHERMAP_API_KEY** - [openweathermap](https://openweathermap.org/) API key, needs registration

Additionally, the following variables can be set:

- **DEBUG** - `True`/`False`, enables http handler logging
- **PORT** - use this to change server port
