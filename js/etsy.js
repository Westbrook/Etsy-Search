window.app = window.app || {
	collection: {},
	model: {},
	view: {}
};
app.model.Listing = Backbone.Model.extend({
	initialize: function() {
		_.bindAll(this);
	},
	url: function() {
		return 	'http://openapi.etsy.com/v2/listings/'+this.id+'.js?api_key=CMCCX1OZDKGQ4M1LA2GLLSJL';	
	},
	scope: function() {
		var newAttrs = this.get('results')[0];
		this.clear();
		this.set(newAttrs);
		this.trigger('scoped');
	}
});
app.collection.Listings = Backbone.Collection.extend({
	initialize: function() {
		_.bindAll(this);
	},
	model: app.model.Listing,
	url: function() {
		return 'http://openapi.etsy.com/v2/listings/active.js?api_key=CMCCX1OZDKGQ4M1LA2GLLSJL&limit='+this.limit+'&keywords='+this.searchTerm;	
	},
	scope: function() {
		this.reset(this.at(0).get('results'));
		this.trigger('scoped');
	},
	limit: 25
});
app.view.Product = Backbone.View.extend({
	el: '#product',
	initialize: function() {
		_.bindAll(this);
		this.template = Handlebars.compile($('#product-template').html());
		this.model.on('scoped', this.render);
		this.render();
	},
	render: function() {
		this.$el.html(this.template(this.model.attributes));
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
	},
	render: function() {
		this.$el.html(this.template());
	},
	searchListings: function(e) {
		e.preventDefault();
		this.listings.searchTerm = this.$el.find('.search-term').val();
		this.listings.fetch({dataType: "jsonp", success: this.listings.scope});
	},
	viewProduct: function(model) {
		this.product = new app.view.Product({model: model});
	}
});