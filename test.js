import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
await browser.close();
