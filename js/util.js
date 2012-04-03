var util = {
	loadTemplates: function(name, callback) {
		$.get('tpl/' + name + '.html', function(data){
			$('#templates').html(data);
			if (callback)
			{
				callback();
			}
		});
	},
	
	getDataFromFile: function(file,callback) {
		if (file)
		{
			var reader = new FileReader();
			
			reader.onloadend = function(evt) {
				if (evt.target.readyState === FileReader.DONE)
				{
					callback(evt.target.result);
				}
			};
			
			reader.readAsText(file);
		}
	}
};