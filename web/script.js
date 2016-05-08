
// BUG: (2) concurrency transp on animation

window.addEventListener('DOMContentLoaded', function() {
    init();
    initControl();
    // setTimeout(function() { hlMesh("Woolf_Room_G-Build_E-Flat_4"); }, 1000);
        
    // setTimeout(function() { hlMesh("Woolf_Room_F-Block_E-Flat_4"); }, 2000);
});

var g_rotation = true;

var g_bla = null;
var g_camera_target_anim = false;
var g_camera_target_anim_max_idx = 20;
var g_camera_target_anim_idx = 0;
var g_camera_target_anim_vec_start = new BABYLON.Vector3(0,0,0);
var g_camera_target_anim_vec_end = new BABYLON.Vector3(0,0,0);
var g_buildings = {colleges:[], blocks:[], flats:[], doors:[]};
var g_fps = [];

var g_iot_devices = new Iot_Device_Collection();
var g_iot_logs = new Iot_Logs();

function initControl()
{
    $("#cb_rotation").change(function() {
	g_rotation = this.checked;
    });
    $("#cb_shadow").change(function() {
	g_bla.shadowsEnabled = this.checked;
    });
    setInterval(function(){
	g_fps.push(g_bla.getEngine().getFps());
	
	var avg = 0;
	$.each(g_fps,function() {
	    avg += this / g_fps.length;
	});

	if (g_fps.length > 10)
	g_fps.shift();
	$("#fpsCounter").text(Math.round(avg));
    }, 500);

}
function init()
{

    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvas, true);

    
var createScene = function() {
    var scene = new BABYLON.Scene(engine);
    scene.shadowsEnabled = false;

    var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 8, 300, BABYLON.Vector3.Zero(), scene);

    camera.setTarget(new BABYLON.Vector3(21,22,23));

    camera.attachControl(canvas, false);
    var ground = BABYLON.Mesh.CreatePlane("plane", 120, scene);
    ground.rotation.x = Math.PI / 2;
    ground.rotation.y = Math.PI / -2.72;
    ground.position.y = -0.01;
    ground.scaling.x = 1.84112;
    ground.scaling.x *= 5.4;
    ground.scaling.y *= 5.4;
   

    var materialGround = new BABYLON.StandardMaterial("textureGround", scene);
    materialGround.diffuseTexture = new BABYLON.Texture("woolf_gmap.png", scene);
    ground.material = materialGround;
    
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 100, 0), scene);
    light.intensity = 0.001;
    var light0 = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 10, 0), scene);
    light0.diffuse = new BABYLON.Color3(1, 1, 1);
    light0.specular = new BABYLON.Color3(1, 1, 1);
    light0.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    light0.intensity = 0.6;

    // var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

    pos = new BABYLON.Vector3(15,2,-20)
    // sphere.position = pos;
    
    var omnilight = new BABYLON.PointLight("Omni0", pos, scene);
    omnilight.diffuse = new BABYLON.Color3(1, 1, 0.8);
    omnilight.intensity = 0.5;
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, omnilight);

    function importBlock(college, block, block_file, offset_x, offset_z)
    {
	//	var door_idx = 9 - 1;
	if ($.inArray(college, g_buildings.colleges) == -1)
	    g_buildings.colleges.push(college);
	if ($.inArray(block, g_buildings.blocks) == -1)
	    g_buildings.blocks.push(block);
	function genMat()
	{
	    var mat = new BABYLON.StandardMaterial("wall", scene);
	    mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
	    mat.specularPower = 10;
	    return mat;
	}

	function importSubBlock(newMeshes, oddness)
	{
	    var door_idx = 9 - 1;
	    for (var i = 0; i < newMeshes.length; i++) {

		newMeshes[i].material = genMat();
		BABYLON.Tags.EnableFor(newMeshes[i]);
		newMeshes[i].addTags("College_" + college + " Block_" + block + " Flat_" + (oddness));
		if ($.inArray(oddness, g_buildings.flats) == -1)
		    g_buildings.flats.push(oddness);


		if (newMeshes[i].id.toLowerCase().indexOf("kitchen") >= 0 || newMeshes[i].id.toLowerCase().indexOf("flat") >= 0)
		{
		    var door_not_room = "";
		    door_str = "";
		    if (newMeshes[i].id.toLowerCase().indexOf("kitchen") >= 0)
			door_not_room = "kitchen";
		    else if (newMeshes[i].id.toLowerCase().indexOf("flat") >= 0)
			door_not_room = "flatdoor";
		    
		    newMeshes[i].addTags("Door_" + door_not_room);
		    if ($.inArray(door_not_room, g_buildings.doors) == -1)
			g_buildings.doors.push(door_not_room);
		}
		
		else
		{
		    door_idx++;
		    door_str = "-Door_" + (door_idx + (oddness - 1) * 8);

		    newMeshes[i].addTags("Door_" + (door_idx + (oddness - 1) * 8));
		    if ($.inArray((door_idx + (oddness - 1) * 8), g_buildings.doors) == -1)
			g_buildings.doors.push((door_idx + (oddness - 1) * 8));

		}
		newMeshes[i].id = newMeshes[i].id.split(".")[0] + "-Block_" + block + "-Flat_" + oddness + door_str;
		newMeshes[i].name = newMeshes[i].id;
		newMeshes[i].receiveShadows = true;
		newMeshes[i].position.x += offset_x;
		newMeshes[i].position.z += offset_z;
		shadowGenerator.getShadowMap().renderList.push(newMeshes[i]);
		for (var j = 0 ; j < 3 ; j++)
		{
		    n = newMeshes[i].id.substring(0, newMeshes[i].id.indexOf("-"));
		    if (n.toLowerCase().indexOf("kitchen") >= 0 || n.toLowerCase().indexOf("flat") >= 0)
		    {
			door_str = "";
			if (n.toLowerCase().indexOf("kitchen") >= 0)
			    door_not_room = "kitchen";
			else if (n.toLowerCase().indexOf("flat") >= 0)
			    door_not_room = "flatdoor";
		    }
		    else
		    {
			floor_door_idx = (j * 2 + oddness + 1) * (newMeshes.length - 2) + door_idx
			door_str = "-Door_" + floor_door_idx;
		    }

		    var newInstance = newMeshes[i].clone(n + "-Block_" + block + "-Flat_" + (j * 2 + oddness + 2) + door_str);
		    BABYLON.Tags.EnableFor(newInstance);
		    newInstance.addTags("College_" + college + " Block_" + block + " Flat_" + (j * 2 + oddness + 2));
		    if ($.inArray((j * 2 + oddness + 2), g_buildings.flats) == -1)
			g_buildings.flats.push((j * 2 + oddness + 2));

		    if (door_str != "")
		    {
			newInstance.addTags("Door_" + floor_door_idx);
			if ($.inArray(floor_door_idx, g_buildings.doors) == -1)
			    g_buildings.doors.push(floor_door_idx);
		    }
		    else
		    {
			newInstance.addTags("Door_" + door_not_room);
			if ($.inArray(door_not_room, g_buildings.doors) == -1)
			    g_buildings.doors.push(door_not_room);
		    }
		    
		    


		    
		    newInstance.position.y += 5.2 * (j + 1);
		    newInstance.material = genMat();
		    shadowGenerator.getShadowMap().renderList.push(newInstance);
		}

	    }
	    
	}



	BABYLON.SceneLoader.ImportMesh("", "buildings/", college + "_" + block_file + "_" + 1 + ".babylon", scene, function (newMeshes) {0
	    importSubBlock(newMeshes, 1);
	});
	BABYLON.SceneLoader.ImportMesh("", "buildings/", college + "_" + block_file + "_" + 2 + ".babylon", scene, function (newMeshes) {
	    importSubBlock(newMeshes, 2);
	});

    }
    // importBlock(college, block, offset_x, offset_y);
    importBlock("Woolf", "E", "E", 54, 60);
    importBlock("Woolf", "C", "E", 54, -107);
    importBlock("Woolf", "F", "F", -35, -95);
    importBlock("Woolf", "G", "F", -35, -17);
    importBlock("Woolf", "H", "F", -35,  61);
    importBlock("Woolf", "D", "D", 54, -23);
    importBlock("Woolf", "A", "A", -25, -193);
    importBlock("Woolf", "B", "A", 38, -193);

    g_buildings.colleges.sort();
    g_buildings.blocks.sort();
    g_buildings.flats.sort();
    g_buildings.doors.sort();
    
    // setTimeout(function() { ResetCamera(); }, 200);
    return scene;
}
    

    
    var scene = createScene();
    g_bla = scene;
    

    engine.runRenderLoop(function() {
	scene.render();
    });

    window.addEventListener('resize', function() {
	engine.resize();
    });

    scene.registerBeforeRender(function () {
	if (g_rotation)
	    scene.activeCamera.alpha += .01;
	if (g_camera_target_anim)
	{
	    g_camera_target_anim_idx += 1;
	    scene.activeCamera.setTarget(BABYLON.Vector3.Lerp(g_camera_target_anim_vec_start , g_camera_target_anim_vec_end, g_camera_target_anim_idx / g_camera_target_anim_max_idx));
	    if (g_camera_target_anim_idx == g_camera_target_anim_max_idx)
	    {
		g_camera_target_anim = false;
		g_camera_target_anim_idx = 0;
		g_camera_target_anim_vec_start = g_camera_target_anim_vec_end;
	    }
	}
    });
}

function meshNameToCollege(name)
{
    s = name.split("_");
    if (s.length == 1)
	return "";
    return s[0];
}

function meshNameToBuilding(name)
{
    s = name.split("-");
    if (s.length == 1)
	return "";
    return s[s.length - 1];
}

function moveCamera(cam, newTarget)
{
    BABYLON.Animation.CreateAndStartAnimation('camRadius', cam, 'radius', 30, 20, cam.radius, 80).loopAnimation = false;

    g_camera_target_anim_vec_end = newTarget;
    g_camera_target_anim = true;
}

function processRawData(data)
{
    console.log(data)
    
    meshes = g_bla.getMeshesByTags(rawDataToTagStr(data.data.key));
    if (meshes[0].matchesTagsQuery(g_iot_devices.dico[data.uuid].selected_lock_rules_str))
    {
	hlMesh(meshes[0].name);
	g_iot_logs.add("<strong>A door have been unlocked.</strong><br /><i>" + meshes[0].name + "<br />User key ID: " + data.data.key.uid + "<br />Device: #" + data.uuid + "</i>", "success");
    }
    else
    {
	hlMesh(meshes[0].name, new BABYLON.Color3(0.5, 0, 0));
	g_iot_logs.add("<strong>Failed attempt to open a door.</strong><br /><i>" + meshes[0].name + "<br />User key ID: " + data.data.key.uid + "<br />Device: #" + data.uuid + "</i>", "danger");
    }
}

function hlMeshByTag(tag)
{
    console.log("received: tag: " + tag)
    meshes = g_bla.getMeshesByTags(tag);
    for (var i = 0 ; i < meshes.length ; i++)
    {
	hlMesh(g_bla.getMeshesByTags(tag)[i].name);
    }

}

function hlMesh(mesh_name, color)
{
    color = typeof color !== 'undefined' ? color : new BABYLON.Color3(0, 0.5, 0);

    scene = g_bla;

    console.log(mesh_name);
    mesh = scene.getMeshByName(mesh_name)
    if (mesh == null)
	return;
    
    for (var i = 0 ; i < scene.meshes.length ; i++)
    {
	mi = scene.meshes[i];
	if (meshNameToCollege(mi.name) == meshNameToCollege(mesh_name) && mi.animations.length == 0)
	    scene.meshes[i].material.alpha = 0.1;
    }

    var animationBox = new BABYLON.Animation("myAnimation", "material.emissiveColor", 30, BABYLON.Animation.ANIMATIONTYPE_COLOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    var keys = [];
    var mat = new BABYLON.StandardMaterial("texture4", scene);
    originalMaterial = mesh.material;
    mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    mat.specularPower = 10;
    mesh.material = mat;


    keys.push({
    	frame: 0,
    	value: new BABYLON.Color3(0, 0, 0)
    });

    keys.push({
    	frame: 10,
    	value: color
    });

    keys.push({
    	frame: 20,
    	value: new BABYLON.Color3(0, 0, 0)
    });


    animationBox.setKeys(keys);

    
    mesh.animations.push(animationBox);
    var newAnim = scene.beginAnimation(mesh, 0, 20, true);

    moveCamera(scene.activeCamera, mesh.position);
    
    setTimeout(function() {
	newAnim.stop();
	newAnim.goToFrame(0);
	mesh.animations.pop();
	mesh.material = originalMaterial;

	for (var i = 0 ; i < scene.meshes.length ; i++)
	{
	    mi = scene.meshes[i];
	    if (meshNameToCollege(mi.name) == meshNameToCollege(mesh_name) && mi.animations.length == 0)
		mi.material.alpha = 1;
	}
	
    }, 5000);
}

function rawDataToTagStr(obj)
{
    block_translate = "ABCDEFGHIJ";
    
    return "Block_" + block_translate[obj.block - 1] + "&&" + "Door_" + obj.door;
}

function fbla()
{
    
    m = g_bla.meshes;
    for (var i = 0 ; i < m.length ; i++)
    {
	console.log(m[i].name);
    }
}



/* */

function Iot_Device(uuid)
{
    this.uuid = uuid;
    this.last_ping = 0;
    this.ping_delay = 5;
    this.dom = null;
    this.selected_lock_rules = {"colleges":"*", "blocks":"*", "flats":"*", "doors":"*"}
    this.selected_lock_rules_str = "";
    this.selected_lock = [];
}

Iot_Device.prototype.ping = function()
{
    this.last_ping = new Date().getTime()/1000;
};

Iot_Device.prototype.getLag = function()
{
    var lag = (new Date().getTime()/1000) - this.last_ping - this.ping_delay;
    // if (lag > this.ping_delay)
    if (lag > 0)
    	return Math.round(lag);
    return 0;
};

Iot_Device.prototype.handleDropdownClicked = function(event)
{
    console.log("bla");
    // console.log(event.data.obj);
    event.data.obj.selected_lock_rules[event.data.type] = $(this).text();
    event.data.obj.dom.find(".dropdown.build-" + event.data.type).find(".title-content").text($(this).text());
    
    console.log(g_iot_devices.list[0].selected_lock_rules);
    event.data.obj.updateSelectedLocks();
};

Iot_Device.prototype.handleSelectedShow = function(event)
{
    console.log("bla2");

    for (var i = 0 ; i < event.data.obj.selected_lock.length ; i++)
	hlMesh(event.data.obj.selected_lock[i].name);

};

Iot_Device.prototype.getLockRules = function()
{
    // var tr_college = {"Woolf": 5}
    // var tr_block = {"A": 1,"B": 2,"C": 3,"D": 4,"E": 5,"F": 6,"G": 7,"H": 8}

    ret = {};
    ret.colleges = (this.selected_lock_rules.colleges in tr_college) ? tr_college[this.selected_lock_rules.colleges] : 0
    ret.blocks = (this.selected_lock_rules.blocks in tr_block) ? tr_block[this.selected_lock_rules.blocks] : 0
    ret.flats = (parseInt(this.selected_lock_rules.flats, 10) == this.selected_lock_rules.flats) ? parseInt(this.selected_lock_rules.flats, 10) : 0
    ret.doors = (parseInt(this.selected_lock_rules.doors, 10) == this.selected_lock_rules.doors) ? parseInt(this.selected_lock_rules.doors, 10) : 0
    return ret;
};

Iot_Device.prototype.updateSelectedLocks = function(event)
{
    //this.selected_lock =
    var rules = []
    if (this.selected_lock_rules.colleges != "*")
	rules.push("College_" + this.selected_lock_rules.colleges);
    if (this.selected_lock_rules.blocks != "*")
	rules.push("Block_" + this.selected_lock_rules.blocks);
    if (this.selected_lock_rules.flats != "*")
	rules.push("Flat_" + this.selected_lock_rules.flats);
    if (this.selected_lock_rules.doors != "*")
	rules.push("Door_" + this.selected_lock_rules.doors);

    this.selected_lock_rules_str = rules.join("&&")
    this.selected_lock = g_bla.getMeshesByTags(this.selected_lock_rules_str);
    this.dom.find(".selected-lock-cnt").text(this.selected_lock.length);

};

function Iot_Device_Collection()
{
    this.list = [];
    this.dico = {};
}

Iot_Device_Collection.prototype.add = function(uuid)
{
    var n = new Iot_Device(uuid);


    // inspired from http://jsfiddle.net/m5TMF/2/
    var template = $(".panel.template");
    var newPanel = template.clone();
    newPanel.removeClass("template");
    newPanel.find(".collapse").removeClass("in");
    newPanel.find(".accordion-toggle").attr("href",  "#" + uuid)
        .text("Device #" + uuid);
    newPanel.find(".panel-collapse").attr("id", uuid).addClass("collapse").removeClass("in");

    newPanel.find(".selected-lock-show").click({obj:n}, n.handleSelectedShow);
    console.log(newPanel.find(".selected-lock-show"));

    
    dropdown_lst = ["colleges", "blocks", "flats", "doors"];
    dropdown_lst_pretty = ["College", "Block", "Flat", "Door"];
    for (var j = 0 ; j < dropdown_lst.length ; j++)
    {

	dropdown_template = $(".dropdown.template");



	newDropdown = dropdown_template.clone();
	newDropdown.removeClass("template");
	newDropdown.addClass("build-" + dropdown_lst[j]);
	
    	// newPanel.find(".dropdown-toggle." + dropdown_lst[j]).attr("id", dropdown_lst[j] + "-" + uuid);
	newDropdown.find(".dropdown-toggle").attr("id", dropdown_lst[j] + "-" + uuid).addClass(dropdown_lst[j]);
	newDropdown.find(".title").text(dropdown_lst_pretty[j]);
	newDropdown.find(".title-content").text(n.selected_lock_rules[dropdown_lst[j]]);
    	var li_base = newDropdown.find(".dropdown-menu").addClass(dropdown_lst[j]).find("li");
	li_base.find("a").click({obj:n, type:dropdown_lst[j]}, n.handleDropdownClicked);
    	for (var i = 0 ; i < g_buildings[dropdown_lst[j]].length ; i++)
    	{

    	    new_li = li_base.clone();
    	    new_li.find("a").text(g_buildings[dropdown_lst[j]][i]);
	    new_li.find("a").click({obj:n, type:dropdown_lst[j]}, n.handleDropdownClicked);
    	    newDropdown.find(".dropdown-menu").append(new_li);
    	}
	newPanel.find(".lst-dropdown").append(newDropdown);
    }

    n.dom = newPanel;
    n.updateSelectedLocks();

    n.ping();
    this.list.push(n);
    this.dico[uuid] = n;
    $("#accordion").append(newPanel.fadeIn());
    g_iot_logs.add("New IOT device have been added.")
};



Iot_Device_Collection.prototype.ping = function(uuid)
{
    if (this.dico.hasOwnProperty(uuid))
	this.dico[uuid].ping();
    else
	this.add(uuid);
};



Iot_Device_Collection.prototype.display = function()
{
    for (var i = 0; i < this.list.length ; i++)
    {
	lag = "";
	// console.log(this.list[i]);
	if (this.list[i].getLag() > 0)
	{
	    lag = this.list[i].getLag();
	    this.list[i].dom.find(".accordion-toggle").attr("href",  "#" + this.list[i].uuid).html("Device #" + this.list[i].uuid + '&nbsp;<span class="badge">Lag: '+lag+'s</span>');
	}
	//console.log("Device nb " + i + " : " + this.list[i].uuid + " " + lag);
	//$("#iotDevices").text(this.list[i].uuid + " " + lag);
    }
};


function Iot_Logs()
{

}

Iot_Logs.prototype.add = function(text, type)
{
    type = typeof type !== 'undefined' ? type : "info";

    
    var template = $("#logCollapse").find(".template");
    var newItem = template.clone();
    
    newItem.removeClass("template");
    newItem.addClass("list-group-item-" + type);
    newItem.html(text);

    $("#logCollapse").find(".list-group").prepend(newItem.fadeIn());
}


setInterval(function(){
    g_iot_devices.display();
    }, 1000);
