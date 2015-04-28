oEmbed is a format for allowing an embedded representation of a URL on third party sites.

Markdown Editor has implementation for several services, to embed as many as third party sites as possible. 
Service that should be used for embedding content can be set via [system setting](systemsettings.md#oembed-service).
You can set more services (delimited by comma), when doing so, other services will be used as fallback when previous service fails embedding.

**Please be aware** that embedded content is saved in it's HTML form, so changing service is not going to change representation of already embedded content.
To refresh embedded content with new settings, you'll need to re-save resources with embeds.

## Services
### Essence
This service uses PHP library [Essence](https://github.com/essence/essence/tree/2.0). 
It can embed most common sites with using their oEmbed endpoint. For presentation is used card-style view.

This service doesn't support [auto color](systemsetting#auto-cards-color).

### Noembed
This service is an implementation of [Noembed](https://noembed.com/) endpoint.

#### Service specific system settings
- `markdowneditor.noembed.nowrap` 
    - Values: `on`/`off`
    - Enable or disable no wrap mode, by default it's enabled

### Embedly Extract
This service is an implementation for [Embed.ly Extract](http://embed.ly/extract) API.
Requirement for using this service is a valid API key, that can be obtain after registering at [Embed.ly](http://embed.ly/) site.
They offer a **free tier** that should be enough for most of users. For presentation is used card-style view.

This service **supports** [auto color](systemsetting#auto-cards-color).

### Embedly Embed
This service is an implementation for [Embed.ly Embed](http://embed.ly/embed) API.
Requirement for using this service is a valid API key, that can be obtain after registering at [Embed.ly](http://embed.ly/) site.
They offer a **free tier** that should be enough for most of users. For presentation is used card-style view.

This service doesn't support [auto color](systemsetting#auto-cards-color).

### Embedly Cards
This is an implementation of [Embed.ly Cards](http://embed.ly/cards). 
You can embed almost any third party site with very nice card style.
  
However, this service uses JS function on frontend to transform URL into embedded content, so you'll notice this transformation when loading page.

#### Service specific system settings
- `markdowneditor.embedlycards.card_controls` 
    - Values: `0`/`1`
    - Enable or disable sharing button
    
## Templates
All current templates are under `core/components/markdowneditor/templates` directory.
Resolving which template will be used is done in this order:

- `md` prefixed chunk
- services/*serviceName*/providers/*providerName*.html
- services/*serviceName*/*embedType*.html
- providers/*providerName*.html
- *embedType*.html
- general.html

You can create a chunk with same name as a template and prefix it with `md` 
(for twitter, it will be `mdTwitter` or for video type, it will be `mdVideo`) to define quick custom template.