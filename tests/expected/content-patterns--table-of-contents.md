```json
{
  "title": "Installation Guide — Example Blog",
  "author": "Jane Doe",
  "site": "Jane Doe",
  "published": ""
}
```

## Installation Guide

This guide walks through the complete installation process for setting up the system with encryption and a custom bootloader on a single disk.

## 1\. Start Here

The system is installed as the sole operating system on a single disk using a two-partition layout.

- Partition `pool` is formatted with the custom filesystem using native encryption.
- Partition `esp` serves as the EFI system partition formatted with `fat32`.

### Acquire the image

Download the latest live ISO install image from the project website.

Verify the image integrity:

```
sha256sum -c --ignore-missing sha256sums.txt
```

### Prepare the USB

Write the installer to an unmounted USB storage device:

```
dd bs=4M conv=fsync oflag=direct status=progress if=installer.iso of=/dev/sdx
```

## 2\. Configure the Environment

Boot the target device from the installation media.

### Set the font

If the existing font size appears too small, run:

```
setfont -d
```

### Set the keyboard

Default keymap is `us`. Set a different keymap with:

```
loadkeys dvorak
```

### Verify boot mode

Check that the system booted in UEFI mode:

```
ls /sys/firmware/efi/efivars
```

### Connect to the internet

Verify network connectivity:

```
ping -c 3 example.org
```

## 3\. Prepare the Disk

### Define variables

Set the disk variable for the target device:

```
DISK=/dev/sda
```

### Wipe disk

Clear any existing partition data:

```
sgdisk --zap-all $DISK
```

### Partition disk

Create the partition layout:

```
sgdisk -n1:1M:+512M -t1:EF00 $DISK
sgdisk -n2:0:0 -t2:BF00 $DISK
```

## 4\. Installation

Install the base system packages:

```
apk add base-system
```

## 5\. Configure the System

### Chroot

Enter the new system:

```
chroot /mnt /bin/sh
```

### Set password

Set the root password:

```
passwd
```

### Packages

Install additional packages:

```
apk add vim openssh
```

### Timezone

Set the timezone:

```
ln -sf /usr/share/zoneinfo/America/New_York /etc/localtime
```

### Hostname

Set the hostname:

```
echo "myhost" > /etc/hostname
```

## 6\. Finish Up

### Unmount

Exit chroot and unmount:

```
exit
umount -R /mnt
```

### Reboot

Remove installation media and reboot:

```
reboot
```

## 7\. Resources

For more information, consult the official documentation and community forums.