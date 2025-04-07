# Microsoft Vision AI

In this project my goal was to try to extract information from receipts and sales invoices by using Microsoft Vision AI. I set myself the following minimum requirements, as to determine when the project would be considered complete:

1. I have to be able to read contents of receipts from an image.
2. I have to be able to read contents of invoices from a PDF.
3. I have to provide a way for other people to test this project.

The first steps were relatively simple to do, since it's pretty simple to read the contents of file as base64 string and dump everything into the Vision AI's prebuilt document models and format the response into a readable format. The harder part was sharing my project with others, without exposing your API secrets to the world.

In the end, since I already had to create the Azure subscription to test the Vision AI, I chose to host my project as a static web application on Azure. That way, I could hide my very secret business logic in Azure Functions and store my API secrets into the app configuration.

## Reading the contents of a receipt

I was actually a bit surprised on how well Vision AI could extract the information from a receipt. In addition of reading the product information, totals and total tax values, it was even able to categorize the contents of a receipt based on the purchased products. For example a receipt with a lot of food items was categorized as a meal.

The only downside I found was that it couldn't extract the product specific VAT, which I understand since there doesn't seem to be a consistent way on how companies list these values. Some companies don't include it into the receipt at all while others add a letter or character at the end of the product line. So finding this information is somewhat doable but not consistent.

## Reading the contents of an invoice

I would say that the Vision AI is pretty good at extracting the basic information from the invoice, as it was able to find the following details:

- Customer's billing and shipping information
- Invoice number and the relevant dates
- Billed products (quantity, unit price, VAT percent and total)
- Payment details (IBAN and SWIFT)

However, it couldn't find some relatively useful information like the invoice's reference number or product specific discounts (of course there's a chance that my test invoices were bad). But overall I would say that while there's room for improvement, the Vision AI is pretty good at extracting the basic information.
