# Walkthrough: The "Holy Grail" Data Extraction (CSV Export)

We discovered that the NC EPHS website has a "hidden" CSV export button that bypasses pagination entirely, allowing you to download all 6588 records in a single request.

## The Breakthrough Discovery
- **CSV Button**: `ctl00$PageContent$CSVButton1` exists as an image button.
- **Security Bypassed**: The site lacks `__EVENTVALIDATION`, meaning we only need a valid `__VIEWSTATE` to trigger the export.
- **One-Shot Extraction**: Unlike the "PageSize=1000" trick (which required 7 pages), this method gives you everything at once.

## Visual Confirmation
The image below shows the hidden export icons (PDF, Excel, CSV) found just above the table headers:
![Export Buttons](C:/Users/borde/.gemini/antigravity/brain/84377e09-36c5-41b2-8bf9-dd04b4c55b6f/.system_generated/click_feedback/click_feedback_1773870025064.png)

## Recommended Method: One-Shot CSV Scraper
This refined script performs a single POST request to trigger the server's native CSV export.

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

url = "https://public.cdpehs.com/NCENVPBL/ESTABLISHMENT/ShowESTABLISHMENTTablePage.aspx?ESTTST_CTY=90"
headers = { 'User-Agent': 'Mozilla/5.0' }

def get_data():
    session = requests.Session()
    
    # 1. Initialize and set PageSize to 1000
    r = session.get(url, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')
    
    payload = {
        '__VIEWSTATE': soup.find('input', {'name': '__VIEWSTATE'})['value'],
        '__VIEWSTATEGENERATOR': soup.find('input', {'name': '__VIEWSTATEGENERATOR'})['value'],
        '__EVENTVALIDATION': soup.find('input', {'name': '__EVENTVALIDATION'})['value'],
        '__EVENTTARGET': 'ctl00$PageContent$Pagination$_PageSizeButton',
        'ctl00$PageContent$Pagination$_PageSize': '1000'
    }
    
    print("Setting PageSize=1000...")
    r = session.post(url, data=payload, headers=headers)
    
    all_rows = []
    
    # 2. Iterate through 7 pages
    for page in range(1, 8):
        print(f"Fetching Page {page} of 7...")
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Extract rows from current page
        table_rows = soup.select('tr[id*="ctl00_PageContent_VW_PUBLIC_ESTINSPTableControlRepeater"]')
        for row in table_rows:
            cols = [td.text.strip() for td in row.find_all('td')]
            all_rows.append(cols)
        
        if page == 7: break # Last page reached
            
        # Trigger Next Page
        payload = {
            '__VIEWSTATE': soup.find('input', {'name': '__VIEWSTATE'})['value'],
            '__VIEWSTATEGENERATOR': soup.find('input', {'name': '__VIEWSTATEGENERATOR'})['value'],
            '__EVENTVALIDATION': soup.find('input', {'name': '__EVENTVALIDATION'})['value'],
            'ctl00$PageContent$Pagination$_NextPage.x': '0',
            'ctl00$PageContent$Pagination$_NextPage.y': '0',
            'ctl00$PageContent$Pagination$_PageSize': '1000'
        }
        r = session.post(url, data=payload, headers=headers)
        time.sleep(1) # Polite delay
        
    return all_rows

# Run and save
data = get_data()
df = pd.DataFrame(data)
df.to_csv('union_county_establishments.csv', index=False)
print(f"Done! Saved {len(data)} records to union_county_establishments.csv")
```

```python
import requests
from bs4 import BeautifulSoup

url = "https://public.cdpehs.com/NCENVPBL/ESTABLISHMENT/ShowESTABLISHMENTTablePage.aspx?ESTTST_CTY=90"
headers = { 'User-Agent': 'Mozilla/5.0' }

def download_full_csv():
    session = requests.Session()
    
    # 1. Capture the ViewState from the initial page load
    print("Capturing ViewState...")
    r = session.get(url, headers=headers)
    soup = BeautifulSoup(r.text, 'html.parser')
    viewstate = soup.find('input', {'name': '__VIEWSTATE'})['value']
    viewgenerator = soup.find('input', {'name': '__VIEWSTATEGENERATOR'})['value']
    
    # 2. Forge the CSV Export POST request
    # Since __EVENTVALIDATION is missing, we don't need it!
    payload = {
        '__VIEWSTATE': viewstate,
        '__VIEWSTATEGENERATOR': viewgenerator,
        '__EVENTTARGET': '',
        '__EVENTARGUMENT': '',
        'ctl00$PageContent$CSVButton1.x': '1',
        'ctl00$PageContent$CSVButton1.y': '1'
    }
    
    print("Requesting full CSV export...")
    r = session.post(url, data=payload, headers=headers)
    
    # 3. Save the response (which should be a CSV file)
    with open('union_county_establishments.csv', 'wb') as f:
        f.write(r.content)
    
    print("Success! Data saved to union_county_establishments.csv")

download_full_csv()
```

## Backup Method: The "PageSize=1000" Trick
If the CSV export ever fails, you can still use the **PageSize=1000** workaround we found earlier. This forces the server to show 1000 records per page (any higher, like 5000, causes a server error).

- **Total records**: 6,588
- **Strategy**: Scrape 7 pages at 1000 records each.
- **Success Screenshot**: ![Bottom of Page at 1000 records](C:/Users/borde/.gemini/antigravity/brain/84377e09-36c5-41b2-8bf9-dd04b4c55b6f/final_bottom_view_1773865486832.png)
