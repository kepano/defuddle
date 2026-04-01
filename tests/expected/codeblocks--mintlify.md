```json
{
  "title": "Cover vs Contain Modes",
  "author": "",
  "site": "Sanity Image",
  "published": ""
}
```

The `mode` prop controls how `SanityImage` handles aspect ratio changes when you specify both `width` and `height`. Understanding the difference between `cover` and `contain` is essential for getting the exact image behavior you need.

## The Two Modes

### Contain Mode (Default)

**Contain** mode treats the dimensions you provide as boundaries, resizing the image to fit inside of them. The output image will match the aspect ratio of the original image—no cropping will occur.

```tsx
<SanityImage
  id={image._id}
  baseUrl="https://cdn.sanity.io/images/abcd1234/production/"
  width={500}
  height={300}
  mode="contain" // or omit, as this is the default
  alt="Product image"
/>
```

With contain mode, if your original image is 1200×800 (3:2 ratio) and you request 500×300 (5:3 ratio), the image will be resized to fit within those boundaries while maintaining its 3:2 aspect ratio.

### Cover Mode

**Cover** mode treats the dimensions you provide as a container, resizing the image to completely fill the dimensions. The output image will match the aspect ratio of the dimensions you provide.

```tsx
<SanityImage
  id={image._id}
  baseUrl="https://cdn.sanity.io/images/abcd1234/production/"
  width={500}
  height={300}
  mode="cover"
  alt="Product image"
/>
```

With cover mode, if your original image is 1200×800 (3:2 ratio) and you request 500×300 (5:3 ratio), the image will be cropped to exactly 500×300 to match your requested aspect ratio.

## Choosing the Right Mode

Use **contain** when:
- You want to preserve the full image without any cropping
- The image might have a different aspect ratio than the display area
- You are displaying photos where every part of the image matters
Use **cover** when:
- You need the image to fill a specific area completely
- Some cropping is acceptable
- You are creating thumbnails or hero images with fixed dimensions