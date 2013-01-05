window.app = {
	collection: {},
	model: {},
	view: {},
	router: {},
	api_key: 'CMCCX1OZDKGQ4M1LA2GLLSJL',
	baseURL: 'http://openapi.etsy.com/v2/'
};
Handlebars.registerHelper('pagination', function() {
	var pagination = '',
		maxPage;
	if(this.count>this.limit) {
		pagination += '<span>Pages: </span>';
		for(var i = this.page-2, max = this.page+2; i <= max; i++){
			if(i==this.page-2 && this.page>1){
				pagination += '<a href="#" data-page="1" title="First Page"><<</a>';
				pagination += '<a href="#" data-page="' + (this.page-1) + '" title="Previous Page"><</a>';	
			}
			if(i>0 && (this.count > (i - 1) * this.limit)){
				pagination += '<a href="#" data-page="' + i + '" title="Page ' + i + '"' + ((this.page==i)?'class="current"':'') + '>' + i + '</a>';
			}
			if(i==this.page+2 && (this.count > this.page * this.limit)){
				pagination += '<a href="#" data-page="' + (this.page+1) + '" title="Next Page">></a>';	
				maxPage = (Math.ceil(this.count / this.limit));
				pagination += '<a href="#" data-page="' + maxPage + '" title="Last Page">>></a>';
			}
		}
	}
	return new Handlebars.SafeString(pagination);
});
app.router.EtsySearch = Backbone.Router.extend({
	routes: {
		"product/:id": 'loadProduct'
	},
	loadProduct: function(id) {
		var model = new app.model.Listing({id: id});
		app.es.products.collection.add(model);
		model.fetch({dataType: "jsonp", success: model.scope});
	}
});
app.model.Listing = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this);
	},
	url: function() {
		return 	app.baseURL + 'listings/'+this.id+'.js?api_key='+app.api_key+'&fields=listing_id,title,price,url,description&includes=Images(url_75x75,url_570xN)';	
	},
	scope: function() {
		var newAttrs = this.get('results')[0];
		this.clear();
		this.set(newAttrs);
		this.trigger('scoped');
	}
});
app.model.Category = Backbone.Model.extend({
	url: function() {
		return app.baseURL + '/taxonomy/categories/'+this.tag+'?api_key='+app.api_key;
	},
	defaults: {
		selected: false
	}
});
app.collection.EtsySearch = Backbone.Collection.extend({
	initialize: function() {
		_.bindAll(this);
	},
	scope: function() {
		var response = this.at(0),
			count = response.get('count');
		//API will return 50100 results count when the results are above 50000.
		//API does not support an offset greater than 50000, so let's ignore any results after that.
		this.count = ((count<=50000)?count:50000);
		this.reset(response.get('results'), {silent: true});
		this.trigger('scoped');
	}
});
app.collection.Listings = app.collection.EtsySearch.extend({
	model: app.model.Listing,
	url: function() {
		var url = app.baseURL;
		url += 'listings/active.js?api_key=';
		url += app.api_key;
		url += '&limit=';
		url += this.limit;
		url += '&keywords=';
		url += this.searchTerm;
		url += '&fields=listing_id,title,price,url,description';
		url += '&includes=Images(url_75x75,url_570xN)&category=';
		url += this.categories.join(' ');
		url += ((this.color!='')?'&color='+this.color+'&color_accuracy=30':'');
		url += ((this.priceMin!=-1)?'&min_price='+this.priceMin:'');
		url += ((this.priceMax!=-1)?'&max_price='+this.priceMax:'');
		url += ((this.offset!=0)?'&offset='+this.offset:'');
		url += ((this.sort_order!='')?'&sort_on='+this.sort_on+'&sort_order='+this.sort_order:'');
		return url;	
	},
	count: 0,
	limit: 10,
	categories: [],
	color: '',
	priceMin: -1,
	priceMax: -1,
	offset: 0,
	sort_on: '',
	sort_order: ''
});
app.collection.Categories = app.collection.EtsySearch.extend({
	url: function() {
		return app.baseURL +'taxonomy/categories.js?api_key='+app.api_key;
	}
});
app.view.Product = Backbone.View.extend({
	className: 'product',
	events: {
		'click .close': 'close'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#product-template').html());
		this.model.on('scoped', this.render);
		this.render();
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;
	},
	close: function() {
		this.remove();	
	}
});
app.view.Products = Backbone.View.extend({
	el: '#products',
	initialize: function() {
		_.bindAll(this);
		this.collection = new app.collection.EtsySearch();	
		this.collection.comparator = function(product) {
			return product.get('title');
		};
		this.collection.on('add remove', this.render);
		this.products = {};
	},
	render: function(model) {
		this.$el.empty();
    	this.collection.each(this.addProduct);
		this.scrollFocus(model);
	},
	addProduct: function(product) {
		this.products[product.get('listing_id')] = new app.view.Product({model: product});
    	this.$el.append(this.products[product.get('listing_id')].render().el);
	},
	scrollFocus: function(product) {
		var scrollTop = this.products[product.get('listing_id')].$el.offset().top;
		this.$el.scrollTop(scrollTop-20);
	}
});
app.view.Controls = Backbone.View.extend({
	events: {
		'click a': 'goToPage'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#controls-template').html());
		this.model = new Backbone.Model();
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;	
	},
	goToPage: function(e) {
		e.preventDefault();
		this.trigger('goToPage', ($(e.currentTarget).data('page')-1) * 10);
	}
});
app.view.Result = Backbone.View.extend({
	className: 'result',
	events: {
		'click .more': 'viewMore'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#result-template').html());
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;	
	},
	viewMore: function() {
		this.model.trigger('viewProduct', this.model);
		app.esRouter.navigate("product/" + this.model.get('listing_id'));
	}
});
app.view.Results = Backbone.View.extend({
	el: '#results',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#results-template').html());
		this.controls = new app.view.Controls();
		this.collection.on('scoped', this.render);	
		this.results = {};
	},
	render: function() {
		this.$el.html(this.template());
    	this.collection.each(this.addResult);
		this.updateControls();
		this.assign(this.controls, '.controls');
		if(this.collection.length>0) {
			this.trigger('hasResults');
		}
		//Scroll to top for every results/page udpate
		this.$el.scrollTop(0);
	},
	updateControls: function() {
		this.controls.model.set({
			count: this.collection.count,
			page: (this.collection.offset / this.collection.limit) + 1,
			limit: this.collection.limit
		});
	},
	addResult: function(result) {
		this.results[result.get('listing_id')] = new app.view.Result({model: result});
    	this.$el.find('.results').append(this.results[result.get('listing_id')].render().el);
	},
	assign : function (view, selector) {
		view.setElement(this.$(selector)).render();
	}
});
app.view.Filter = Backbone.View.extend({
	className: 'filter',
	events: {
		'click .add-category': 'addCategory'
	},
	initialize: function() {
		_.bindAll(this);
		this.model.on('change:selected', this.render);
		this.template = Handlebars.compile($('#filter-template').html());
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;	
	},
	addCategory: function() {
		this.model.set('selected', !this.model.get('selected'));
	}
});
app.view.Categories = Backbone.View.extend({
	el: '#categories',
	events: {
		'click h3': 'showAll'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#filterType-template').html());
		this.collection = new app.collection.Categories();
		this.collection.on('scoped', this.render);
		this.collection.fetch({dataType: "jsonp", success: this.collection.scope});
		this.filters = {};
	},
	filterType: 'Categories',
	render: function() {
		this.$el.html(this.template({filterType: this.filterType}));
    	this.collection.each(this.addOne);
	},
	addOne: function(filter) {
		this.filters[filter.get('category_id')] = new app.view.Filter({model: filter});
    	this.$el.append(this.filters[filter.get('category_id')].render().el);
	},
	showAll: function() {
		this.$el.find('h3').toggleClass('show');
		this.$el.find('.filter').toggle();	
	}
});
app.view.Colors = app.view.Categories.extend({
	el: '#colors',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#filterType-template').html());
		this.collection = new Backbone.Collection([
			{long_name: "White", hex: "FFFFFF", category_id: 0},
			{long_name: "Red", hex: "FF0000", category_id: 1},
			{long_name: "Orange", hex: "FF7700", category_id: 2},
			{long_name: "Yellow", hex: "FFFF00", category_id: 3},
			{long_name: "Green", hex: "00FF00", category_id: 4},
			{long_name: "Blue", hex: "0000FF", category_id: 5},
			{long_name: "Violet", hex: "FF00FF", category_id: 6},
			{long_name: "Black", hex: "000000", category_id: 7}
		]);
		this.filters = {};
		this.render();
	},
	filterType: 'Colors'
});
app.view.Prices = app.view.Categories.extend({
	el: '#prices',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#filterType-template').html());
		this.collection = new Backbone.Collection([
			{long_name: "Less than $10", hex: "FFFFFF", category_id: 0,priceMin:-1,priceMax:10},
			{long_name: "$10 - $50", hex: "FF0000", category_id: 1,priceMin:10,priceMax:50},
			{long_name: "$50 - $100", hex: "FF7700", category_id: 2,priceMin:50,priceMax:100},
			{long_name: "$100 - $500", hex: "FFFF00", category_id: 3,priceMin:100,priceMax:500},
			{long_name: "$500 - $1000", hex: "00FF00", category_id: 4,priceMin:500,priceMax:1000},
			{long_name: "More than $1000", hex: "0000FF", category_id: 5,priceMin:1000,priceMax:-1}
		]);
		this.filters = {};
		this.render();
	},
	filterType: 'Price'
});
app.view.Filters = Backbone.View.extend({
	el: '#filters',
	initialize: function() {
		_.bindAll(this);	
		this.template = Handlebars.compile($('#filters-template').html());
		this.render();
		this.categories = new app.view.Categories();
		this.colors = new app.view.Colors();
		this.prices = new app.view.Prices();
	},
	render: function() {
		this.$el.html(this.template());	
	},
});
app.view.SortBy = Backbone.View.extend({
	className: 'sort',
	events: {
		'click .sortBy': 'sortBy'
	},
	initialize: function() {
		_.bindAll(this);
		this.model.on('sorted', this.render);
		this.template = Handlebars.compile($('#sort-template').html());
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
		return this;	
	},
	sortBy: function() {
		this.model.set('selected', !this.model.get('selected'));
	}
});
app.view.Sorting = app.view.Categories.extend({
	el: '#sorting',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#sorting-template').html());
		this.collection = new Backbone.Collection([
			{long_name: "Relevance", sortType: "score", direction: '', category_id: 0},
			{long_name: "Price", sortType: "price", direction: '', category_id: 1}
		]);
		this.sortBys = {};
		this.render();
	},
	addOne: function(sortBy) {
		this.sortBys[sortBy.get('category_id')] = new app.view.SortBy({model: sortBy});
    	this.$el.append(this.sortBys[sortBy.get('category_id')].render().el);
	},
	filterType: 'Sort By'
});
app.view.EtsySearch = Backbone.View.extend({
	el: '#app',
	events: {
		'click .search': 'searchListings',
		'submit form': 'searchListings'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#app-template').html());
		this.render();
		this.listings = new app.collection.Listings();
		this.results = new app.view.Results({
			collection: this.listings
		});
		this.results.collection.on('viewProduct', this.viewProduct);
		this.results.on('hasResults', this.showResults);
		this.results.controls.on('goToPage', this.goToPage);
		this.filters = new app.view.Filters();
		this.filters.categories.collection.on('change', this.updateCategories);
		this.filters.colors.collection.on('change', this.updateColors);
		this.filters.prices.collection.on('change', this.updatePrices);
		this.sorting = new app.view.Sorting();
		this.sorting.collection.on('change', this.updateSorting);
		this.listings.on('scoped', this.showOptions);
		this.products = new app.view.Products();
	},
	render: function() {
		this.$el.html(this.template());
	},
	getResults: function() {
		this.listings.fetch({dataType: "jsonp", success: this.listings.scope});
	},
	showResults: function() {
		this.$el.removeClass('no-results');
	},
	showOptions: function() {
		this.sorting.$el.show();
		this.filters.$el.show();
	},
	searchListings: function(e) {
		e.preventDefault();
		this.listings.searchTerm = this.$el.find('.search-term').val();
		this.getResults();
	},
	viewProduct: function(model) {
		//Make sure this model wasn't added from the single product feed.
		if(this.products.collection.where({id: model.get('listing_id')}).length==0) {
			this.products.collection.add(model);
		}
	},
	updateSorting: function(sortType) {
		var direction = sortType.get('direction'),
			newDirection;
		_.each(this.sorting.collection.models, function(oldSortType) {
			oldSortType.set({direction: ''},{silent: true});
		});
		if(sortType.get('sortType')=="score"){
			newDirection = ((direction=='')?'down':'');
		} else {
			switch (direction) {
				case 'down':
					newDirection = "";
					break;
				case 'up':
					newDirection = "down";
					break;
				default:
					newDirection = "up";
					break;
			}
		}
		sortType.set({'direction':newDirection},{silent:true});
		sortType.trigger('sorted');
		this.listings.sort_order = sortType.get('direction');
		if(this.listings.sort_orger == '') {			
			this.listings.sort_on = '';
		} else {
			this.listings.sort_on = sortType.get('sortType');
		}
		this.getResults();
	},
	updateCategories: function() {
		var categories = [];
		this.filters.categories.collection.each(function(category){
			if(category.get('selected')) {
				categories.push(category.get('category_name'));
			}
		});
		this.listings.categories = categories;
		this.getResults();
	},
	updateColors: function(color) {
		var keep = true;
		if(color.get('selected')){
			this.listings.color = color.get('hex');
		} else {
			this.listings.color = '';
			keep = false;
		}
		_.each(this.filters.colors.collection.models, function(oldColor) {
			oldColor.set({selected: false},{silent: true});
		});
		if(keep)
			color.set({selected: true},{silent: true});
		_.each(this.filters.colors.filters, function(colorView) {
			colorView.render();
		});
		this.getResults();
	},
	updatePrices: function(price) {
		var keep = true;
		if(price.get('selected')){
			this.listings.priceMin = price.get('priceMin');
			this.listings.priceMax = price.get('priceMax');
		} else {
			this.listings.priceMin = -1;
			this.listings.priceMax = -1;
			keep = false;
		}
		_.each(this.filters.prices.collection.models, function(oldPrice) {
			oldPrice.set({selected: false},{silent: true});
		});
		if(keep)
			price.set({selected: true},{silent: true});
		_.each(this.filters.prices.filters, function(priceView) {
			priceView.render();
		});
		this.getResults();
	},
	goToPage: function(offset) {
		this.listings.offset = offset;
		this.getResults();	
	}
});