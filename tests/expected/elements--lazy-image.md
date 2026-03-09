```json
{
  "title": "Node.js and CPU profiling on production (in real-time without downtime)",
  "author": "Vincent Vallet",
  "site": "Voodoo Engineering",
  "published": "2019-10-18T17:23:34.816Z"
}
```

[![Vincent Vallet](https://miro.medium.com/fit/c/96/96/1*vFTVh_mYyf0p6m7f77A3vw.jpeg)](https://lazy-image/@vincentvallet?source=post_page-----d6e62af173e2----------------------)

[Vincent Vallet](https://lazy-image/@vincentvallet?source=post_page-----d6e62af173e2----------------------)

## Why CPU monitoring is important?

I work at [Voodoo](http://voodoo.io/), a French company that creates mobile video games. We have a lot of challenges with performance, availability, and scalability because of the insane amount of traffic our infrastructure supports (billions of events/requests per day). In this setting, every metric is important and gives us a lot of information about the state of our system.

When working with Node.js one of the most critical resources to monitor is the CPU. Most of the time, when working on a low traffic API or project we don't realize how many simple lines of code can have a huge impact on CPU. On the other hand, when traffic increases, a simple mistake can cost dearly.

For memory, constant monitoring is the best practice to track the worst developer nightmare a.k.a memory leak.

![](https://miro.medium.com/max/60/1*5o3M5niyi911waUrKWVZ0Q.png?q=20)

Memory leak in action

> Stay focused on the CPU!

![](https://miro.medium.com/max/60/1*8uOdeOfnUzTaFIY1r7oAMg.png?q=20)

Basic CPU monitoring

## CPU profiling: what's the difference with CPU monitoring?

Basically, for Node.js, CPU profiling is nothing more than collecting data about functions which are CPU consuming.

## Add arguments to Node.js

Node.js provides a way to collect data about CPU with two command lines.

```c
node --prof app.js
```
![](https://miro.medium.com/max/60/1*e7gjTlzi55udTXbbPeEs2A.png?q=20)

Output of — prof

- It needs to restart the application to launch a CPU profiling
- It is NOT suited for a production environment

![CPU profiling before optimization](https://miro.medium.com/max/60/1*CANkRN_yzl9tfrGd2F41wQ.png?q=20)

CPU profiling before optimization

**How can we identify an issue?**

A CPU profiling should be read like this: The wider is the block the more it consumes CPU. So we are looking for the widest blocks.

![CPU profiling after optimization](https://miro.medium.com/max/60/1*EO-pr4RolgcAOj_Uk1rpDA.png?q=20)

CPU profiling after optimization

What do we observe? Blocks are a lot smaller! It means that functions consume less CPU individually.

## Conclusion

CPU profiling is a must-have for every Node.js application running on production.