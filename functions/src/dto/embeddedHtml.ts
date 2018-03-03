export class EmbeddedHtml {
    type: string = 'rich';
    version: string = '1.0';
    title: string;
    author_name: string = "Ellis Creek Farm";
    author_url: string = "https://www.elliscreekfarm.com";
    provider_name: string = "Ellis Creek Farm";
    provider_url: string = "https://www.elliscreekfarm.com";
    html: string;
    height: number;
    width: number;

    constructor(title: string, contents: string, height: number, width: number) {
        this.title = title;
        this.html = contents;
        this.height = height;
        this.width = width;
    }

    public toJSONString(): string {
        return JSON.stringify(this);
    }

    public toXMLString(): string {
        return `<?xml version="1.0" encoding="utf-8" standalone="yes"?><oembed><type>${this.type}</type>` +
            `<version>${this.version}</version><title>${this.title}</title><author_name>${this.author_name}</author_name>` +
            `<author_url>${this.author_url}</author_url><provider_name>${this.provider_name}</provider_name>` +
            `<provider_url>${this.provider_url}</provider_url><html>${this.html}</html><height>${this.height}</height>` +
            `<width>${this.width}</width></oembed>`
    }
}