---
layout: "../layouts/BlogPost.astro"
title: "What is a Design System"
slug: what-is-a-design-system
description: ""
added: "May 22 2023"
tags: [other]
updatedDate: "July 2 2023"
---

Companies trying to create consistent digital experiences for their customers have to make hundreds of design decisions every day. Instead of approaching each decision on a one-off basis, design systems provide repeatable solutions to common design problems, like what font to use, where to place an image, or how an entire website can meet accessibility standards.

A design system is an ever evolving collection of reusable components, guided by rules that ensure consistency and speed, by being the single source of truth for any product development. It's more than a *style guide* or a *pattern library*.

## What does a design system include?
Design systems often start with high-level guidelines and common use cases — logo placement, what buttons should look like, and an approved color palette. As systems mature, they grow more granular to include guidelines for every customer touchpoint from digital ads and emails to multichannel campaigns, with details like fonts, spacing, typography, iconography, and theming.

- **Design principles** or the rules and values that drive your design team. Design principles will differ from company to company, and they will likely reflect the brand’s core values.
- **A design pattern library** or a central repository of approved and commonly used patterns. A pattern is “a repetition of more than one design element working in concert with each other.” Those elements can be shapes, lines, colors, etc.
- **A UI kit/component library** like buttons, widgets, and more. These assets allow teams to create consistent, UI-friendly designs more quickly.
- **Design process guidelines**, which help designers interpret design principles as they execute a task.
- **Accessibility elements and guidelines** that help teams create designs that are more accessible to all users and that comply with the Web Content Accessibility Guidelines (WCAG).

## What kind of design system?
Every design system is a little bit different. We can almost say that there is one kind of design system per team or product.

**Strict or loose?**

A **strict system** will have a comprehensive and detailed documentation and will be fully synchronized between design and development. There will be a strict process for introducing a new pattern in the system. A strict system should be very broad in order to cover the majority of cases the teams may encounter.

A **loose system** will leave more space for experimentation. The system is here to provide a framework for the teams while preserving some freedom. Designers and developers are free to use it or not, regarding their particular needs for their product.

**Modular or integrated?**

A **modular system** is made of interchangeable and reusable parts. It suits well for projects that have to scale quickly and that have to adapt to multiple user needs. The negative part is that it’s often more expensive to realize because it can be difficult to make modules that can be independent while working well together. This kind of system will particularly fit large scale product as e-commerce, finance and governments websites.

An **integrated system** focus on one unique context. It’s also composed of parts, but these parts will not be interchangeable. This kind of system suits products that have very few repeating parts.

**Centralized or distributed?**

In a **centralized model**, one team is in charge of the system and makes it evolve. This team is here to facilitate the work of the other teams and has to be very close to them, to be sure that the System covers most of their needs.

In a **distributed model**, several people of several teams are in charge of the system. The adoption of the system is quicker because everyone feels involve but it also needs team leaders that will keep an overall vision of it.

## Color variable starter kit

|   Name  |  Day  |  Night |
|  ----   |  ---- |  ----  |
|  bg  |  #value  |  #value 
|  bg-secondary  |  #value  |  #value 
|  bg-inactive  |  #value  |  #value 
|  bg-brand  |  #value  |  #value 
|  bg-brand-hover  |  #value  |  #value 
|  bg-accent  |  #value  |  #value 
|  bg-accent-hover  |  #value  |  #value 
|  bg-success  |  #value  |  #value 
|  bg-success-hover  |  #value  |  #value 
|  bg-error  |  #value  |  #value  
|  bg-error-hover  |  #value  |  #value 
|  bg-wraning  |  #value  |  #value  
|  bg-warning-hover  |  #value  |  #value 
|  bg-action  |  #value  |  #value  
|  bg-action-hover  |  #value  |  #value 
|  border  |  #value  |  #value  
|  border-secondary  |  #value  |  #value 
|  border-inactive  |  #value  |  #value  
|  border-success  |  #value  |  #value 
|  border-error  |  #value  |  #value  
|  border-warning  |  #value  |  #value 
|  text  |  #value  |  #value  
|  text-secondary  |  #value  |  #value 
|  text-brand  |  #value  |  #value  
|  text-accent  |  #value  |  #value 
|  text-inactive  |  #value  |  #value  
|  text-success  |  #value  |  #value 
|  text-error  |  #value  |  #value 
|  text-warning  |  #value  |  #value 

> Some meanings:
> - Primary - Default, the most common use
> - Secondary – Supporting, less prominence
> - Brand – Company color
> - Accent – Brand alternate

## Getting started with Storybook
[Storybook](https://storybook.js.org) helps with the development process of design systems and component libraries. Normally, you'd have to build out a whole app in order to see your components as you create them. Storybook allows you to develop components independently so you can focus on styling and interaction. You can use it with many different frontend libraries such as React, Angular, Vue, or even just with HTML.

Read more at https://welearncode.com/storybook/

## Some examples and resources
- A collection of awesome design systems: https://github.com/alexpate/awesome-design-systems

- Stack Overflow's Design System: https://stackoverflow.design

- GOV.UK Design System: https://design-system.service.gov.uk

- Atlassian's Design System: https://atlassian.design

- Shopify's Design System: https://polaris.shopify.com

- GitHub’s design system: https://primer.style
