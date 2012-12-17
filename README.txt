Etsy Search (0.1.0) allows users to search the Etsy API for products by keyword and then once products are loaded into the app sort them by price or relevancy, as well as filter them by cost, color and category.  Search results introduce users to the product by name, small image and price, while inviting them to "Learn More".  Here the user is met with a large image of the product, the full description of what is offered as well as a link into Etsy.com to learn even more product options as well as initiate a purchase.  Products when selected are collected into a list so that you can view all the products you are interested in at once and remove those that you would no longer like with a single click.  The most recent product you have selected is deep linked to that it can be bookmarked and shared.

Best viewed:
Currently the app is best viewed in Chrome and OSX as it allows the view to experience the site without scroll bars, which will be removed in future iterations with the inclusion of JS scroll capturing.

Dependancies:
jQuery 1.8.2
Underscore 1.4.3
Backbone 0.9.2
Handlebars 1.0.rc.1

TODOs:
Loading/Empty results views.
Search step deep linking.
Deep linking for multiple product selections.
-Considerations:
	-free API request capping 10/s
Merge router more thorouhly and maintainably into the app.
Extended product details content/designs
-Price/Store/Size/etc.
-Images slideshow
Extended category filtering by subcategory
Update to JS scrolling so all browsers receive a bar free UI like Chrome in OSX.
Responsive design for mobile UI
Investigate caching for offline viewing similar to http://labs.ft.com/2012/08/basic-offline-html5-web-app/
JS and UI automated testing: (qUnit and Selenium?)

