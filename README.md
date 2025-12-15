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
