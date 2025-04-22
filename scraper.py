import requests
from bs4 import BeautifulSoup
from datetime import datetime  # Moved to top

URL = "https://www.ville.quebec.qc.ca/citoyens/loisirs_sports/installations_sportives/piscines_interieures/piscines_interieures_fiche.aspx?entID=165"

def scrape():
    response = requests.get(URL)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        html_content = soup.prettify()

        with open("datapiscinesvq.html", "w", encoding="utf-8") as file:
            file.write(f"<!-- Scraped at {datetime.utcnow()} UTC -->\n")
            file.write(html_content)

        print("Scraping complete! Saved as 'datapiscinesvq.html'.")
    else:
        print(f"Failed to retrieve content. Status code: {response.status_code}")

if __name__ == "__main__":
    scrape()
