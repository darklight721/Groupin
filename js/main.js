(function($){

	Backbone.View.prototype.close = function() {
		console.log('Closing View ' + this);
		if (this.beforeClose) 
		{
			this.beforeClose();
		}
		this.remove();
		this.unbind();
	}

	var Entity = Backbone.Model.extend({
		defaults: {
			starred: false,
			name: 'Insert name here',
			group: 0
		}
	});
	
	var EntityCollection = Backbone.Collection.extend({
		model: Entity
	});
	
	var Group = Backbone.Model.extend({
		defaults: {
			name: 'Group'
		}
	});
	
	var GroupCollection = Backbone.Collection.extend({
		model: Group
	});
	
	var EntityListView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.model.bind("reset", this.render, this);
			var self = this;
			this.model.bind("add", function(entity){
				$(self.el).append(new EntityListItemView({model:entity}).render().el);
			});
		},
		
		render: function(eventName) {
			_.each(this.model.models, function(entity){
				$(this.el).append(new EntityListItemView({model:entity}).render().el);
			}, this);
			return this;
		}
	});
	
	var EntityListItemView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#entity-list-item').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		events: {
			"change .name": "changeEntity",
			"click .star": "starEntity",
			"click .delete": "deleteEntity"
		},
		
		changeEntity: function(event) {
			this.model.set({
				name: event.target.value
			});
		},
		
		starEntity: function() {
			var star = !(this.model.get('starred'));
			this.model.set({
				starred: star
			});
			return false;
		},
		
		deleteEntity: function() {
			this.model.destroy({
				success: function() {
					alert('Entity deleted successfully');
					window.history.back();
				}
			});
			return false;
		}
	});
	
	var GroupListView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.model.bind("reset", this.render, this);
			var self = this;
			this.model.bind("add", function(group){
				$(self.el).append(new GroupListItemView({model:group}).render().el);
			});
		},
		
		render: function(eventName) {
			_.each(this.model.models, function(group){
				$(this.el).append(new GroupListItemView({model:group}).render().el);
			}, this);
			return this;
		}
	});
	
	var GroupListItemView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#group-list-item').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		
		events: {
			"change .name": "changeGroup",
			"click .delete": "deleteGroup"
		},
		
		changeGroup: function(event) {
			this.model.set({
				name: event.target.value
			});
		},
		
		deleteGroup: function() {
			this.model.destroy({
				success: function() {
					//alert('Entity deleted successfully');
					//window.history.back();
				}
			});
			return false;
		}
	});
	
	var AppRouter = Backbone.Router.extend({
		
		routes: {
			"": "home"
		},
		
		home: function() {
			this.entityList = new EntityCollection();
			
			this.entityList.push();
			this.entityList.push();
			
			this.entityListView = new EntityListView({model: this.entityList});
			
			$('#list').html(this.entityListView.render().el);
		}
	});
	
	var app;
	util.loadTemplate('template',function(){
		app = new AppRouter();
		Backbone.history.start();
	});
	
	
})(jQuery);