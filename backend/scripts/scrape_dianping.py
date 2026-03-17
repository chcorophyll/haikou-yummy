import asyncio
import json
import os
from playwright.async_api import async_playwright
from dotenv import load_dotenv

print("--- Scraper Script Initializing ---")
load_dotenv()
print("--- Dotenv Loaded ---")

# We need to import our app models and db after loading dotenv
from app.models.restaurant import RestaurantCreate, GeoJSONPoint
from app.core.database import connect_to_mongo, get_database, close_mongo_connection
print("--- Imports Successful ---")

async def scrape_dianping_details(page, name):
    """
    Search for a restaurant on Dianping and try to extract address and phone.
    """
    search_url = f"https://www.dianping.com/search/keyword/2/0_{name}"
    print(f" -> Searching for: {name}")
    
    try:
        # Increase timeout and use a slightly different wait strategy
        await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        
        # Check if we are blocked or redirected to a login page
        if "login" in page.url or "verify" in page.url:
            print(f"    [!] Blocked by CAPTCHA or Login page: {page.url}")
            return None

        # Look for the first result link
        shop_link_selector = ".shop-list .tit a"
        first_shop = await page.query_selector(shop_link_selector)
        
        if not first_shop:
            print(f"    [?] No results found for {name}")
            return None
        
        # Click the first shop or get its link
        shop_href = await first_shop.get_attribute("href")
        if not shop_href.startswith("http"):
            shop_href = "https:" + shop_href
            
        print(f"    [+] Found shop detail link: {shop_href}")
        
        # Navigate to shop detail
        await page.goto(shop_href, wait_until="domcontentloaded", timeout=60000)
        
        # Extract address and phone
        address_el = await page.query_selector(".address-info")
        tel_el = await page.query_selector(".tel")
        
        address = await address_el.inner_text() if address_el else None
        tel = await tel_el.inner_text() if tel_el else None
        
        if address:
            address = address.replace("地址：", "").strip()
        if tel:
            tel = tel.replace("电话：", "").strip()
            
        return {"address": address, "telephone": tel}

    except Exception as e:
        print(f"    [!] Error scraping {name}: {e}")
        return None

async def main():
    print("--- Starting Main ---")
    # Load data from existing JSON
    data_path = "scripts/cleaned_restaurants.json"
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found.")
        return

    print(f"--- Loading data from {data_path} ---")
    with open(data_path, "r", encoding="utf-8") as f:
        restaurants = json.load(f)

    print(f"--- Loaded {len(restaurants)} restaurants ---")
    print("--- Connecting to MongoDB ---")
    await connect_to_mongo()
    db = get_database()
    collection = db["restaurants"]
    print("--- MongoDB Connected ---")

    async with async_playwright() as p:
        print("--- Launching Browser ---")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()
        print("--- Browser Context Created ---")

        for rest in restaurants:
            name = rest["name"]
            
            # Skip if already has phone and address is detailed
            if rest.get("telephone") and len(rest.get("address", "")) > 10:
                print(f"Skipping {name} (already has details)")
                continue

            details = await scrape_dianping_details(page, name)
            
            if details:
                print(f"    [*] Scraped: Address={details['address']}, Tel={details['telephone']}")
                
                # Update local list
                if details["address"]:
                    rest["address"] = details["address"]
                if details["telephone"]:
                    rest["telephone"] = details["telephone"]
                
                # Update MongoDB
                await collection.update_one(
                    {"name": name},
                    {"$set": {
                        "address": rest["address"],
                        "telephone": rest["telephone"]
                    }}
                )
                print(f"    [✓] Updated {name} in DB.")
            
            # Sleep to avoid trigger anti-bot
            await asyncio.sleep(5)

        await browser.close()

    # Save updated JSON
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    print("--- Scraping and Updating Finished ---")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
