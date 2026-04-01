```json
{
  "title": "Introducing Socket Firewall",
  "author": "",
  "site": "Socket Blog",
  "published": ""
}
```

We are excited to announce Socket Firewall, a new feature that blocks supply chain attacks before they reach your infrastructure. This post explains how it works and why we built it.

## How It Works

Socket Firewall intercepts package installation requests and checks them against our threat intelligence database. When a package is flagged as malicious, the installation is blocked and you receive an alert with details about the threat.

The system uses a combination of static analysis, dynamic analysis, and community reports to identify malicious packages. Our team reviews flagged packages and updates the database in real time.

## Why We Built It

Supply chain attacks have increased significantly over the past few years. Attackers publish packages with names similar to popular libraries, hoping developers will accidentally install them. Socket Firewall provides an automated defense against this class of attack.

We believe that security should be automatic and invisible. Developers should be able to install packages without worrying about supply chain attacks. Socket Firewall makes this possible.