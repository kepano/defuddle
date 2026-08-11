```json
{
  "title": "Cloud Resources",
  "author": "",
  "site": "",
  "published": ""
}
```

## Enumerating cloud resources

Subdomains often point at cloud storage buckets. Resolving each one in turn reveals which hosts are worth a closer look before moving on.

```shellsession
user@host[~]$ for i in $(cat subdomains);do host $i | grep "has address";done

blog.example.com 10.10.10.1
www.example.com 10.10.10.2
```

Each address that answers can then be checked against the public storage endpoints for the provider that owns the range.
