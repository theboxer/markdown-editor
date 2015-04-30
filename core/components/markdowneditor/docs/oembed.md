oEmbed is a format which allows embedding a representation of an URL of a third-party site. Many sites support specific formatting of their content specifically for this purpose such as most popular image and video provides, but also sites like Amazon, MonoPrice, xkcd, and more.

_Markdown Editor_ has supports several oEmbed endpoint services, to allow embedding as many as third-party sites as possible. 

Service that should be used for embedding content can be set via [system setting](systemsettings.md#oembed-service). You can set more services (via a comma-delimited list) in the system setting. When doing so, other services will be used as a fallback fo previous service fails embedding.

**Please be aware** that embedded content is saved in its HTML form, so changing services will not change the representation of already-embedded content. To refresh embedded content with the new settings, you will need to re-save Resources with embeds.

## Services
### Essence
This service uses PHP library [Essence](https://github.com/essence/essence/tree/2.0). It can embed most common sites using their oEmbed endpoint. For presentation it uses card-style views.

This service does not support [auto color](systemsetting#auto-cards-color).

### Noembed
This service is an implementation of the [Noembed](https://noembed.com/) endpoint.

#### Service specific system settings
- `markdowneditor.noembed.nowrap` 
    - Values: `on`/`off`
    - Enable or disable no wrap mode, by default it's enabled

### Embedly Extract
This service is an implementation for the [Embed.ly Extract](http://embed.ly/extract) API.
To use this service, you must have a valid API key which can be obtain after registering at the [Embed.ly](http://embed.ly/) site.
They offer a free tier that should be enough for most users. It presents a card-style view.

This service supports [auto color](systemsettings.md#auto-cards-color).

### Embedly Embed
This service is an implementation for the [Embed.ly Embed](http://embed.ly/embed) API.
To use this service, you must have a valid API key which can be obtain after registering at the [Embed.ly](http://embed.ly/) site.
They offer a free tier that should be enough for most users. It presents a card-style view.

This service does not support [auto color](systemsettings.md#auto-cards-color).

### Embedly Cards
This is an implementation of [Embed.ly Cards](http://embed.ly/cards). 
You can embed almost any third-party site with very nice, enhanced card styles specific to each service.
  
However, this service uses JS functions on the front end to transform URLs into embedded content. This results in a noticeable delay for the content transformation when loading pages.

#### Service specific system settings
- `markdowneditor.embedlycards.card_controls` 
    - Values: `0`/`1`
    - Enable or disable sharing button
    
## Templates
All templates are inside the `core/components/markdowneditor/templates` directory. Templates use the first one found in the following order:

- `md` prefixed chunk
- services/*serviceName*/providers/*providerName*.html
- services/*serviceName*/*embedType*.html
- providers/*providerName*.html
- *embedType*.html
- general.html

You can create a chunk with same name as a template and prefix it with `md` 
(e.g., for Twitter, it would be `mdTwitter` or for a video type, it will be `mdVideo`) to define a quick custom template.