import { VercelRequest, VercelResponse } from '@vercel/node';
import { clamp, isEmpty, readFile, lowercase } from './_lib/utils';
import cheerio from "cheerio";
import path from "path";

const CACHE_BROWSER = 60 * 60 * 24 * 2; // 2 days
const CACHE_CDN = 60 * 60 * 24 * 7; // 7 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log("HTTP", req.url, req.query);

    try {
        const vendor = !isEmpty(req.query['vendor']) ? <string>req.query['vendor'] : null;
        const spec = !isEmpty(req.query['spec']) ? <string>req.query['spec'] : null;
        const color = !isEmpty(req.query['color']) ? <string>req.query['color'] : null;
        const size = !isEmpty(req.query['size']) ? <string>req.query['size'] : 32;

        if (!vendor) {
            throw `No iconset picked`;
        }

        const iconReq = {
            vendor,
            icon: <string>req.query.icon,
            size: clamp(16, size, 512),
            spec,
            color,
        };

        const icon = await generateFontawesome(iconReq);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', `max-age=${CACHE_BROWSER}, s-maxage=${CACHE_CDN}, public`);
        res.end(icon);
    } catch (e: any) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/html");
        res.end(typeof e === 'string' ? e : e.message || 'Unknown error');
    }
}

export async function generateFontawesome(req: IconReq): Promise<string> {
    try {
        // Read icon file
        var file = await readFile(path.resolve('node_modules', `@obr/fontawesome/dist/${lowercase(req.spec)}/${req.icon}.svg`));
    } catch (e: unknown) {
        throw `Icon not found ${req.spec}/${req.icon}`;
    }

    // Parse SVG to AST
    const $ = cheerio.load(file.toString('utf-8'));
    const $svg = $('svg');

    // Update attributes
    if (req.color) {
        $svg.attr('color', `#${req.color}`);
        $svg.attr('fill', `#${req.color}`);
    }

    $svg.attr('width', String(req.size));
    $svg.attr('height', String(req.size));

    // Export icon
    const svg = $.html('svg');

    return svg;
}
