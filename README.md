# Backstory

I was describing my job as a Software Engineer to my 5‑year‑old the other day and talked about all the things I could code, including games. A couple weeks later he came up to me and wanted me to write him a game. I was like, ‘Sure, let’s see if AI can help write it.’ He gave me the initial requirements, and we tweaked it as he QA’d it or had other suggestions. While I didn’t teach him to actually code, I think it was still useful to teach the thought process of iteration. Next time though I'll ask him to put in Linear tickets. This is the second game he had me make. Dogbike Dodge being the first!

# Monster Truck Dash

Simple monster truck racing game where you dodge muddy puddles and race a goofy CPU.

Play at https://mtruck.tryonlinux.com

## Run locally

Open `public/index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
```

Then visit `http://localhost:8000`.

## Cloudflare Pages

This is a static site. Deploy the folder as-is. If you use a custom domain, update:

- `public/index.html` for `canonical` and `og:*` tags
- `public/robots.txt` and `public/sitemap.xml`

## License

MIT — see `LICENSE`.
