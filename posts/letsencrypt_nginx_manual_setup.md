---
title: Setting up Let's Encrypt with NGINX in Docker
date: 2022-11-17
tags: LetsEncrypt, nginx
---

I was setting up Let's Encrypt today for the first time, and it's impressive how easy they've made this process that used to be a big hassle. Our NGINX configuration at work is too complicated for certbot's bulit-in configuration management, and so we write the configuration ourselves.

# NGINX Configuration

First, you need to respond to the ACME request on non-secure HTTP. This configuration does that while redirecting everything else to HTTPS.

```nginx
server {
  listen 80;
  server_name   _;
  # The directory that certbot will use to respond to the ACME challenge
  root /var/www;

  location /.well-known/acme-challenge {
    try_files $request_uri =404;
  }

  location / {
    rewrite ^ https://$host$request_uri? permanent;
  }
}
```

After that, you can set up your server as normal, but one problem remains...

# SSL Certificate Bootstrapping

You don't have the SSL certificates yet, and NGINX won't start if they aren't present.

This would present a chicken-and-egg problem, but we can supply a fake chicken in the form of a self-signed certificate.

Browsers will reject this, but that's ok. All we really need to do is get NGINX to start so it can serve the port 80 ACME requests, then certbot will be able to function.

:::note

You could also just comment out the `server` block that needs the SSL certificate, but that is more of a hassle IMO.

:::

Since I always forget how to generate a simple self-signed SSL cert, here's one method:

```sh
openssl req -nodes -batch -x509 -newkey rsa:2048 \
  -keyout privkey.pem -out fullchain.pem -days 360
```

Then you can copy the resulting files into the proper location in `/etc/letsencrypt/live/$CERTNAME/`, and start NGINX.

Now, `certbot` doesn't really like if there's some fake self-signed certificate in the directory it's expecting to use, so once NGINX is started you'll want to delete the files you just created. 

```sh
sudo rm -i /etc/letsencrypt/live/$CERTNAME/*.pem
sudo rmdir /etc/letsencrypt/live/$CERTNAME
```

Finally, you can run `certbot certonly --nginx --cert-name $CERTNAME -d $DOMAIN` to generate the certificate.

# NGINX inside Docker

If you're running NGINX inside a Docker container, you should use certbot's `webroot` method instead of the `nginx` method.

```sh
certbot certonly \
  --webroot -w /var/www \
  --key-type ecdsa \
  --cert-name $CERTNAME \
  -d $DOMAIN
```

In this case you'll also need to tell the NGINX in the docker container to reload, and certbot makes this easy with post-renewal hooks. 

Create the file `/etc/letsencrypt/renewal-hooks/post/nginx-docker-reload.sh` with these contents:

```sh
#!/bin/bash
set -e
docker exec -it nginx nginx -s reload
echo Reloaded nginx!
```

You can test this script by running `sudo certbot renew --dry-run`.

If you need to copy the SSL certificates from `/etc/letsencrypt/live/$CERTNAME` to somewhere else that the Docker container can
see, you can also do it in that hook.

# Alternative Methods

I should note that ACME/LetsEncrypt/certbot can also work via DNS records. For this particular case that was not an option, but it could make things easier, and certbot has a number of plugins to interface with various DNS providers.
