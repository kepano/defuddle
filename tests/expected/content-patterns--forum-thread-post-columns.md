```json
{
  "title": "Choosing a bench power supply for a hobby lab",
  "author": "",
  "site": "forum.example.com",
  "published": ""
}
```

### Topic: Choosing a bench power supply for a hobby lab (Read 1234 times)

#### alice

- Regular Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 412
- Country: ![ca](https://forum.example.com/Themes/default/images/flags/ca.png "Canada")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Choosing a bench power supply for a hobby lab

« **on:** March 3, 2026, 01:15:00 pm »

I am setting up a small electronics bench at home and need a linear or switching supply.  
  
Budget is around 150 dollars. I mostly build audio kits and the occasional microcontroller board, so 30 V and 3 A should be plenty. Is a two channel unit worth the extra cost, or should I buy one good single channel supply and a USB breakout for the logic side?

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### bob

- Super Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 5120
- Country: ![de](https://forum.example.com/Themes/default/images/flags/de.png "Germany")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #1 on:** March 3, 2026, 02:15:00 pm »

Two channels are worth it once you start working on op-amp circuits that need a split rail.  
You can wire them in series for a symmetric supply, which saves building a separate negative rail on every prototype.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### carol

- Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 87
- Country: ![us](https://forum.example.com/Themes/default/images/flags/us.png "United States")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #2 on:** March 3, 2026, 03:15:00 pm »

Pay attention to the current limit behaviour. Some cheap units overshoot for a few milliseconds when the output is enabled, which is enough to kill a small LED or a sensitive sensor module.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### dave

- Frequent Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 903
- Country: ![gb](https://forum.example.com/Themes/default/images/flags/gb.png "United Kingdom")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #3 on:** March 4, 2026, 04:15:00 pm »

I would avoid the fan-cooled switching models in that price range. The fan noise is constant and the ripple is noticeable on audio work.  
A used linear supply from a known brand is usually a better buy than a new no-name one.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### erin

- Frequent Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 1288
- Country: ![au](https://forum.example.com/Themes/default/images/flags/au.png "Australia")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #4 on:** March 4, 2026, 05:15:00 pm »

Here is the one I ended up with after reading a few teardown threads.  
  
It has a proper soft start, the encoder knobs feel solid, and the output relay does not chatter when you toggle it. The display only shows two decimals, which is enough for hobby use.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

The following users thanked this post: [bob](https://forum.example.com/index.php?action=profile;u=12), [carol](https://forum.example.com/index.php?action=profile;u=13)

---

#### frank

- Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 64
- Country: ![nz](https://forum.example.com/Themes/default/images/flags/nz.png "New Zealand")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #5 on:** March 4, 2026, 06:15:00 pm »

Does anyone know whether the remote sense terminals on these units actually work, or are they just decorative binding posts?

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### bob

- Super Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 5121
- Country: ![de](https://forum.example.com/Themes/default/images/flags/de.png "Germany")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #6 on:** March 5, 2026, 07:15:00 pm »

On the model erin linked they are real. You need to remove the shorting links on the back panel first, otherwise the sense lines are tied to the outputs internally.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### grace

- Newbie
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 12
- Country: ![fr](https://forum.example.com/Themes/default/images/flags/fr.png "France")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #7 on:** March 5, 2026, 08:15:00 pm »

Thanks everyone, this thread answered most of my questions too. I ordered a two channel unit and a set of silicone test leads.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### alice

- Regular Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 413
- Country: ![ca](https://forum.example.com/Themes/default/images/flags/ca.png "Canada")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #8 on:** March 5, 2026, 09:15:00 pm »

Final update: I went with a used two channel linear supply from a local seller.  
  
Ripple measured under two millivolts with my scope, the current limit works as expected, and both channels track nicely in series mode. Thanks for all the advice.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### heidi

- Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 230
- Country: ![se](https://forum.example.com/Themes/default/images/flags/se.png "Sweden")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #9 on:** March 6, 2026, 10:15:00 pm »

Good choice. Remember to check the electrolytic capacitors inside if it is more than fifteen years old, and give the binding posts a clean while you are at it.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

---

#### dave

- Frequent Contributor
- ![\*](https://forum.example.com/Themes/default/images/star.gif) ![\*](https://forum.example.com/Themes/default/images/star.gif)
- Posts: 904
- Country: ![gb](https://forum.example.com/Themes/default/images/flags/gb.png "United Kingdom")

![](https://forum.example.com/Themes/default/images/post/xx.gif)

##### Re: Choosing a bench power supply for a hobby lab

« **Reply #10 on:** March 6, 2026, 11:15:00 pm »

Agreed. Also check the fuse rating on the mains inlet, previous owners sometimes fit a larger one than the transformer can handle.

![](https://forum.example.com/Themes/default/images/ip.gif) Logged

The following users thanked this post: [alice](https://forum.example.com/index.php?action=profile;u=11)