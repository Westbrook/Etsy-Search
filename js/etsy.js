window.app = {
	collection: {},
	model: {},
	view: {},
	api_key: 'CMCCX1OZDKGQ4M1LA2GLLSJL',
	baseURL: 'http://openapi.etsy.com/v2/'
};
app.model.Listing = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this);
	},
	url: function() {
		return 	'http://openapi.etsy.com/v2/listings/'+this.id+'.js?api_key='+app.api_key+'';	
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
		return 'http://openapi.etsy.com/v2/taxonomy/categories/'+this.tag+'?api_key='+app.api_key;
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
		this.reset(this.at(0).get('results'));
		this.trigger('scoped');
	}
});
app.collection.Listings = app.collection.EtsySearch.extend({
	model: app.model.Listing,
	url: function() {
		var url = app.baseURL;
		url += 'listings/active.js?api_key=';
		url += app.api_key;
		url += '&min_price=500&limit=';
		url += this.limit;
		url += '&keywords=';
		url += this.searchTerm;
		url += '&includes=Images&category=';
		url += this.categories.join(' ');
		url += ((this.color!='')?'&color='+this.color+'&color_accuracy=30':'');
		url += ((this.priceMin!=-1)?'&min_price='+this.priceMin:'');
		url += ((this.priceMax!=-1)?'&max_price='+this.priceMax:'');
		return url;	
	},
	limit: 10,
	categories: [],
	color: '',
	priceMin: -1,
	priceMax: -1
});
app.collection.Categories = app.collection.EtsySearch.extend({
	url: function() {
		return 'http://openapi.etsy.com/v2/taxonomy/categories.js?api_key='+app.api_key;
	}
});
app.view.Product = Backbone.View.extend({
	el: '#product',
	events: {
		'click .close': 'unrender'
	},
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#product-template').html());
		this.model.on('scoped', this.render);
		this.render();
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
	},
	unrender: function() {
		this.$el.empty();
		this.unbind();	
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
	}
});
app.view.Results = Backbone.View.extend({
	el: '#results',
	initialize: function() {
		_.bindAll(this);
		this.collection.on('scoped', this.render);	
		this.results = {};
	},
	render: function() {
		this.$el.empty();
    	this.collection.each(this.addResult);
	},
	addResult: function(result) {
		result.on('viewProduct', this.viewProduct);
		this.results[result.get('listing_id')] = new app.view.Result({model: result});
    	this.$el.append(this.results[result.get('listing_id')].render().el);
	},
	viewProduct: function(model) {
		this.trigger('viewProduct', model);
	}
});
app.view.Filter = Backbone.View.extend({
	className: 'category',
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
		this.$el.find('.category').toggle();	
	}
});
app.view.Colors = app.view.Categories.extend({
	el: '#colors',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#filterType-template').html());
		this.collection = new app.collection.Categories([
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
		this.collection = new app.collection.Categories([
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
		this.results.on('viewProduct', this.viewProduct);
		this.filters = new app.view.Filters();
		this.filters.categories.collection.on('change', this.updateCategories);
		this.filters.colors.collection.on('change', this.updateColors);
		this.filters.prices.collection.on('change', this.updatePrices);
		this.listings.on('scoped', this.showCategories);
	},
	render: function() {
		this.$el.html(this.template());
	},
	getResults: function() {
		this.listings.fetch({dataType: "jsonp", success: this.listings.scope});
	},
	showCategories: function() {
		this.filters.$el.show();
	},
	searchListings: function(e) {
		e.preventDefault();
		this.listings.searchTerm = this.$el.find('.search-term').val();
		this.getResults();
	},
	viewProduct: function(model) {
		this.product = new app.view.Product({model: model});
	},
	updateCategories: function() {
		var categories = [];
		this.categories.collection.each(function(category){
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
	}
});