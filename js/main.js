(function($){

	var tabIndex = 9999;

	Backbone.View.prototype.close = function() {
		console.log('Closing View ' + this);
		if (this.beforeClose) 
		{
			this.beforeClose();
		}
		this.remove();
		this.unbind();
	}

	// ** ENTITIES **********************************************************************************

	var Entity = Backbone.Model.extend({
		defaults: {
			starred: false,
			name: '',
			group: 0
		}
	});
	
	var EntityCollection = Backbone.Collection.extend({
		model: Entity
	});
	
	var EntityMainView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			// load templates
			this.tpl_main = _.template($('#tpl-entity-main').html());
			this.tpl_alter_input_toggler = _.template($('#tpl-alter-input-toggler').html());
			this.tpl_entity_count = _.template($('#tpl-entity-count').html());
			
			// bind model
			this.model.bind('reset', this.renderEntities, this);
			this.model.bind('remove', this.renderEntityCount, this);
			var self = this;
			this.model.bind('add', function(entity){
				var el_entity_list = $(self.el).find('#entity-list');
				$(el_entity_list).prepend(new EntityListItemView({model:entity}).render().el);
				tabIndex--;
				self.renderEntityCount();
			});
			
			this.alterInputShow = true;
			this.on("change:alterInputShow", this.renderAlterInputToggler, this);
			
		},
		
		render: function(eventName) {
			$(this.el).html(this.tpl_main());
			this.renderAlterInputToggler();
			this.renderEntities();
			this.toggleAlterInput();
			return this;
		},
		
		renderAlterInputToggler: function() {
			var el_alter_input_toggler = $(this.el).find('#alter-input-toggler');
			$(el_alter_input_toggler).html(this.tpl_alter_input_toggler({"direction":this.alterInputShow?'left':'right'}));
		},
		
		renderEntities: function() {
			// render entity list items	
			var el_entity_list = $(this.el).find('#entity-list');
			$(el_entity_list).html('');
			_.each(this.model.models, function(entity){
				$(el_entity_list).prepend(new EntityListItemView({model:entity}).render().el);
			}, this);
			
			this.renderEntityCount();
		},
		
		renderEntityCount: function() {
			// render entity count
			var el_entity_count = $(this.el).find('#entity-count');
			$(el_entity_count).html(this.tpl_entity_count({"count":this.model.length}));
		},
		
		events: {
			"click #alter-input-toggler" : "toggleAlterInput",
			"keypress #entity-name" : "enterName",
			"click #entity-add" : "addEntity",
			"click #entity-reset" : "resetEntity"
		},
		
		toggleAlterInput: function() {
			$("#alter-input").toggle();
			this.alterInputShow = !(this.alterInputShow);
			this.trigger("change:alterInputShow");
		},
		
		enterName: function(e) {
			if (e.keyCode === 13) // on enter keypress
			{
				e.preventDefault();
				this.addEntity();
				return false;
			}
		},
		
		addEntity: function() {
			var entityName = $.trim($('#entity-name').val());
			if(entityName.length > 0)
			{
				this.model.push({
					starred: false,
					name: entityName,
					group: 0
				});
			}
			
			// clear value
			$('#entity-name').val('');
			$('#entity-name').focus();
		},
		
		resetEntity: function() {
			this.model.reset();
		}
	});
	
	var EntityListItemView = Backbone.View.extend({
		tagName: 'li',
		
		initialize: function() {
			this.template = _.template($('#tpl-entity-list').html());
			this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);

			this.tabIndex = tabIndex;
		},
		
		render: function(eventName) {
			$(this.el).html(this.template({
				name: this.model.get('name'),
				star: this.model.get('starred') ? '' : '-empty',
				tabIndex: this.tabIndex
			}));
			return this;
		},
		
		events: {
			"change .entity-name": "changeEntity",
			"click .entity-star": "starEntity",
			"click .entity-delete": "deleteEntity"
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
	
	var AlterInputView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-alter-input').html());
			this.delimiter = '\n';
		},
		
		render: function(eventName) {
			$(this.el).html(this.template());
			return this;
		},
		
		events: {
			"change #delimiter": "change",
			"change #other-delimiter": "change",
			"click #import": "import",
			"change #file-input": "readFile"
		},
		
		readFile: function(event) {
			var file = event.target.files ? event.target.files[0] : null;
			
			util.getDataFromFile(file, function(data){
				$('#text').val(data);
			});
		},
		
		change: function(event) {
			console.log(event.target.value);
			if (event.target.value)
			{
				if ($('#delimiter').val() === 'other')
				{
					$('#other-delimiter').show();
				}
				else
				{
					switch(event.target.value)
					{
						case '\\n': 
							this.delimiter = '\n';
							break;
						case '\\t':
							this.delimiter = '\t';
							break;
						default:
							this.delimiter = event.target.value;
							break;
					}
					$('#other-delimiter').hide();
				}
			}
		},
		
		import: function() {
			var text = $('#text').val();
			// reset model collection
			app.entityList.reset();
			_.each(text.split(this.delimiter), function(entity){
				entity = $.trim(entity);
				if (entity)
				{
					app.entityList.push({name:entity});
				}
			});
		}
	});

	// ** END: ENTITIES *******************************************************************************

	// ** GROUPS **************************************************************************************

	var Group = Backbone.Model.extend({
		defaults: {
			index: 0,
			name: 'Group'
		}
	});
	
	var GroupCollection = Backbone.Collection.extend({
		model: Group
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
			$(this.el).html("");
			_.each(this.model.models, function(group){
				$(this.el).append(new GroupListItemView({model:group}).render().el);
			}, this);
			return this;
		}
	});
	
	var GroupListItemView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.tpl_main = _.template($('#tpl-group-list-item').html());
			this.tpl_entity = _.template($('#tpl-group-list-entity').html());
			//this.model.bind("change", this.render, this);
			this.model.bind("destroy", this.close, this);
		},
		
		render: function(eventName) {
			$(this.el).html(this.tpl_main(this.model.toJSON()));

			var el_group_entity = $(this.el).find(".group-entity-list");
			var groupEntities = app.entityList.where({group: this.model.get("index")});
			_.each( groupEntities, function(entity){
				var obj = {
					"star" : entity.get("starred") ? "" : "-empty",
					"name" : entity.get("name"),
					"hidden" : ""
				};
				$(el_group_entity).append(this.tpl_entity(obj));
			}, this);

			// somehow needed to add a hidden div to correct misalignments of groupings
			var groupCount = parseInt($('#group-count').val());
			var totalEntities = app.entityList.length;
			if (groupEntities.length !== Math.ceil(totalEntities/groupCount))
			{
				var obj = {
					"star" : "",
					"name" : "",
					"hidden" : "hidden"
				};
				$(el_group_entity).append(this.tpl_entity(obj));
			}

			return this;
		},
		
		events: {
			"change .group-name": "changeGroup"
		},
		
		changeGroup: function(event) {
			this.model.set({
				name: event.target.value
			});
		}
	});

	// ** END: GROUPS *******************************************************************************

	// ** CONTROLS **********************************************************************************

	var ControlView = Backbone.View.extend({
		tagName: 'div',
		
		initialize: function() {
			this.template = _.template($('#tpl-control').html());
			this.model.bind("add", this.render, this);
			this.model.bind("destroy", this.render, this);
			this.model.bind("reset", this.render, this);
			
			this.groupCount = 1;
			this.on("change:groupCount", this.render, this);
		},
		
		render: function(event) {
			this.validateGroupCount();
			var obj = {
				"groupCount" : this.groupCount,
				"plusDisabled" : this.groupCount < this.model.length ? '' : 'disabled',
				"minusDisabled": this.groupCount > 1 ? '' : 'disabled'
			};
			$(this.el).html(this.template(obj));
			return this;
		},
		
		validateGroupCount: function() {
			if (isNaN(this.groupCount))
				this.groupCount = 1;
			else if (this.groupCount < 1)
				this.groupCount = 1;
			else if (this.groupCount > this.model.length)
				this.groupCount = this.model.length;
		},
		
		events: {
			"change #group-count": "change",
			"keypress #group-count" : "enterGroup",
			"click .plus": "addOne",
			"click .minus": "minusOne",
			"click #groupin": "group"
		},
		
		change: function(event) {
			this.groupCount = parseInt(event.target.value);
			this.trigger("change:groupCount");
		},
		
		enterGroup: function(event) {
			if (event.keyCode === 13)
			{
				event.preventDefault();
				return false;
			}
		},
		
		addOne: function() {
			this.groupCount++;
			this.trigger("change:groupCount");
		},
		
		minusOne: function() {
			this.groupCount--;
			this.trigger("change:groupCount");
		},
		
		group: function() {

			var groups = [];
				
			// Create groups
			var groupCount = parseInt($('#group-count').val());
			for (var i = 0; i < groupCount; i++)
			{
				groups.push({index: i, name: "Group "+(i+1)});
			}
			
			// Assign members to groups
			var randomList = _.shuffle(app.entityList.where({starred: false}));
			var randomStarredList = _.shuffle(app.entityList.where({starred: true}));

			var groupIndex = 0;
			_.each(randomList,function(entity){
				entity.set("group",groupIndex);
				groupIndex = (groupIndex+1) % groupCount;
			});
			_.each(randomStarredList,function(entity){
				entity.set("group",groupIndex);
				groupIndex = (groupIndex+1) % groupCount;
			});
			
			showGroups.call(app,groups);	
		}
	});

	var GroupinModel = Backbone.Model.extend({
		urlRoot: "api/groupin",
		defaults: {
			"entities": '',
			"groups": ''
		}
	});

	var ShareBtnView = Backbone.View.extend({

		initialize: function() {
			this.template = _.template($('#tpl-share-btn').html());
		},

		render: function(eventName) {
			$(this.el).html(this.template());
			return this;
		},

		events: {
			"click .share": "shareGroupin"
		},

		shareGroupin: function() {
			if (app.entityList.length && app.groupList.length)
			{
				var groupin = new GroupinModel();
				groupin.set({
					entities: JSON.stringify(app.entityList.toJSON()),
					groups: JSON.stringify(app.groupList.toJSON())
				});
				groupin.save({
					success: function() {
						alert("sucess");
					},
					error: function() {
						alert("error");
					}
				});
			}
		}
	});

	// ** END: CONTROLS *****************************************************************************

	// ** ROUTER ************************************************************************************
	
	var AppRouter = Backbone.Router.extend({
		
		routes: {
			"" : "home",
			":id" : "loadSave" 
		},
		
		home: function() {
			showEntities.call(this);
			showOtherUI.call(this);
		},

		loadSave: function(id) {
			var groupin = new GroupinModel();
			groupin.set("id",id);
			var self = this;
			groupin.fetch({
				success: function() {
					var entities = JSON.parse(groupin.get("entities"));
					showEntities.call(self,entities);
					
					showOtherUI.call(self);

					var groups = JSON.parse(groupin.get("groups"));
					showGroups.call(self,groups);
				},
				error: function() {
					alert("error");
				}
			});
		}
	});

	// ** END: ROUTER ********************************************************************************

	var showEntities = function(entities) {
		if (this.entityList)
		{
			this.entityList.reset();
		}
		else
		{
			this.entityList = new EntityCollection();
		}

		if (entities)
			this.entityList.add(entities, {silent: true});

		if (this.entityView)
			this.entityView.close();
		
		this.entityView = new EntityMainView({model:this.entityList});
		$('#entity-view').html(this.entityView.render().el);
	};

	var showOtherUI = function() {
		$('#alter-input').html(new AlterInputView().render().el);
		$('#controls').html(new ControlView({model: this.entityList}).render().el);

		// add additional ui
		$('.entity-star').tooltip({animation:true,title:'Starred names will be distributed fairly and equally among the groups.',delay:{show:800,hide:100}});
	};

	var showGroups = function(groups) {
		if (this.groupList)
		{
			this.groupList.reset();
		}
		else
		{
			this.groupList = new GroupCollection();
		}

		if (groups)
			this.groupList.add(groups, {silent: true});

		if (this.groupListView)
			this.groupListView.close();

		this.groupListView = new GroupListView({model:this.groupList});
		$('#group-list').html(this.groupListView.render().el);

		// hide alter input view 
		if (this.entityView.alterInputShow)
			this.entityView.toggleAlterInput();

		// show share button
		if (!this.shareBtnView)
		{
			this.shareBtnView = new ShareBtnView();
			$('#share').html(this.shareBtnView.render().el);	
		}	
	};
	
	var app;
	util.loadTemplates('template',function(){
		app = new AppRouter();
		Backbone.history.start();
	});
	
	
})(jQuery);