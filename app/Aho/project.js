(function() {
	angular.module('Aho').factory('Project', function($http, $q, $mdDialog, Editor) {
		var slideCount = 0;
		var Project = {};

		Project.pname = 'Dự án trình diễn 3D test 1';

        //action type
        Project.atypes = [
            {
                id:0,
                name:'Đi tới',
                color:'#27AE60'
            },
            {
                id:1,
                name:'Dừng lại',
                color:'#BE1B38'
            },
            {
                id:2,
                name:'Phóng to vào',
                color:'#F1C40F'
            },
            {
                id:3,
                name:'Bay xung quanh',
                color:'#008DDE'
            },
            {
                id:4,
                name:'Hiệu ứng tuyết rơi',
                color:'#AA72C1'
            },             
            {
                id:5,
                name:'Mưa ma trận',
                color:'#E86644'
            }
        ]
        Project.MoveToPoint = 0;
        Project.StopPoint = 1;
        Project.ZoomTo = 2;
        Project.FlyAround = 3;
        Project.EffectSnow = 4;
        Project.EffectMatrix = 5;
                
        Project.playSlide = 0;

		Project.slides = [];
        Project.activeSlide = null;
		Project.playSlide = 0;
		Project.actions = [];
		Project.activeCam = Editor.camera;

		Project.activeSlide = null;
        Project.tab1Selected = 0;
        Project.texturePath = '';


		var handleJSON = function(data, file, filename) {
			if (data.metadata === undefined) { // 2.0
				data.metadata = {
					type: 'Geometry'
				};
			}

			if (data.metadata.type === undefined) { // 3.0
				data.metadata.type = 'Geometry';
			}

			if (data.metadata.version === undefined) {
				data.metadata.version = data.metadata.formatVersion;
			}

			if (data.metadata.type === 'BufferGeometry') {
				var loader = new THREE.BufferGeometryLoader();
				var result = loader.parse(data);
				var mesh = new THREE.Mesh(result);
				Editor.addObject(mesh);
				Editor.select(mesh);

			} else if (data.metadata.type.toLowerCase() === 'geometry') {
				var loader = new THREE.JSONLoader();
				loader.setTexturePath(Project.texturePath);
				var result = loader.parse(data);
				var geometry = result.geometry;
				var material;
				if (result.materials !== undefined) {
					if (result.materials.length > 1) {
						material = new THREE.MeshFaceMaterial(result.materials);
					} else {
						material = result.materials[0];
					}

				} else {
					material = new THREE.MeshPhongMaterial();
				}
				geometry.sourceType = "ascii";
				geometry.sourceFile = file.name;
				var mesh;
				if (geometry.animation && geometry.animation.hierarchy) {
					mesh = new THREE.SkinnedMesh(geometry, material);
				} else {
					mesh = new THREE.Mesh(geometry, material);
				}
				mesh.name = filename;
				Editor.addObject(mesh);
				Editor.select(mesh);

			} else if (data.metadata.type.toLowerCase() === 'object') {
				var loader = new THREE.ObjectLoader();
				loader.setTexturePath(scope.texturePath);
				var result = loader.parse(data);
				if (result instanceof THREE.Scene) {
					Editor.setScene(result);
				} else {
					Editor.addObject(result);
					Editor.select(result);
				}
			} else if (data.metadata.type.toLowerCase() === 'scene') {
				// DEPRECATED
				var loader = new THREE.SceneLoader();
				loader.parse(data, function(result) {
					Editor.setScene(result.scene);
				}, '');
			} else if (data.metadata.type.toLowerCase() === 'slide') {
                Project.slides.push(JSON.parse(data))                
            } else if (data.metadata.type.toLowerCase() === 'action') {
                Project.actions.push(JSON.parse(data))                
            }
		};

		Project.loadJsonFile = function(file) {
			var filename = file.name;
			var extension = filename.split('.').pop().toLowerCase();

			switch (extension) {
				case 'json':
				case 'js':
					var reader = new FileReader();
					reader.addEventListener('load', function(event) {
						var contents = event.target.result;
						// 2.0
						if (contents.indexOf('postMessage') !== -1) {

							var blob = new Blob([contents], {
								type: 'text/javascript'
							});
							var url = URL.createObjectURL(blob);

							var worker = new Worker(url);

							worker.onmessage = function(event) {

								event.data.metadata = {
									version: 2
								};
								handleJSON(event.data, file, filename);

							};
							worker.postMessage(Date.now());
							return;
						}
						// >= 3.0
						var data;
						try {

							data = JSON.parse(contents);

						} catch (error) {

							alert(error);
							return;
						}
						handleJSON(data, file, filename);
					}, false);
					reader.readAsText(file);
					break;

				default:
					alert('Unsupported file format (' + extension + ').');
					break;
			};
		};

        Project.slideClick = function(slide) {
            Project.activeSlide = slide;
            Project.tab1Selected = 1;
        }




		Project.addMoveTo = function(camPos) {};

		Project.addSlide = function() {
			slideCount++;            
            var time_start = 0;
            var time_end = 0;
            var l = Project.slides.length;
            if (l>0) {
                time_start = time_end = Project.slides[l-1].time_end;
            }
			Project.slides.push(
				new Slide({					
					sname: 'Trình diễn ' + slideCount,
                    time_start:time_start,
                    time_end:time_end
				}));
		};

        Project.addAction = function(atype_id) {
  
            function ActDialogController($scope, $mdDialog) {
              $scope.duration = 0;
              $scope.start_time = Project.activeSlide.time_end;
              $scope.hide = function() {
                $mdDialog.hide();
              };
              $scope.cancel = function() {
                $mdDialog.cancel();
              };
              $scope.clickOk = function() {
                $mdDialog.hide($scope.duration,$scope.start_time);
              };
            }

            var adata = {};

            if (Project.activeSlide == null) {
                alert('Bạn phải chọn 1 Slide nào đó!');
                return;
            }
            switch (atype_id) {
                case 0:     
                    adata = Project.activeCam.position;
                    break;
                case 1:    
                case 2:
                case 3: 
                break;
            default:
                    alert('unknown action type');
                    break;
            };            

            if (atype_id<4) {
                $mdDialog.show({
                      controller: ActDialogController,
                      templateUrl: 'app/Aho/views/act-add-dialog.tmpl.html',
                      parent: angular.element(document.body),
                      clickOutsideToClose:true                    
                    }).then(function(duration,start_time){
                        Project.actions.push(new Action(atype_id,start_time,duration,adata));
                        Project.activeSlide.time_end += duration;
                    });                
            }

        }

		Project.toJSON = function() {
			return {
				camera: Project.activeCam.toJSON(),
				scene: Editor.scene.toJSON(),
                slides: JSON.stringify(Project.slides),
                actions: JSON.stringify(Project.actions)
			};
		};


        Project.importJson = function() {
            var fileInput = document.createElement( 'input' );
            fileInput.type = 'file';
            fileInput.addEventListener( 'change', function ( event ) {
                Project.loadJsonFile( fileInput.files[ 0 ] );
            } );            
            fileInput.click();
        }

		var exportString = function(output, filename) {


            var link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link); // Firefox workaround, see #6594

			var blob = new Blob([output], {
				type: 'text/plain'
			});
			var objectURL = URL.createObjectURL(blob);

			link.href = objectURL;
			link.download = filename || 'data.json';
			link.target = '_blank';

			var event = document.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			link.dispatchEvent(event);

		};

		Project.exportJson = function() {
			var output = Project.toJSON();
			try {
				output = JSON.stringify(output, null, '\t');
				output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
			} catch (e) {
				output = JSON.stringify(output);
			}
			exportString(output, Project.pname + '.json');
		}

		Slide = function(params) {
			this.sname = params.sname;
			this.uuid = THREE.Math.generateUUID();
            this.time_start = params.time_start;
            this.time_end = params.time_end;
            this.type = "slide";
            Project.activeSlide = this;
		};



		Action = function(atype_id, start_time, duration, adata) {
			this.atype = Project.atypes[atype_id]; // move to point, zoom to point, run around object,
			this.duration = duration;
			this.loop = false;
			this.start_time = start_time;
            this.adata = adata;
            this.type = 'action';
            if (Project.activeSlide!=null)
                this.id_slide = Project.activeSlide.uuid;            
		};

		Action.prototype.play = function() {
			if (this.running)
				return;

			this.startTime = Date.now();
			this.running = true;

			// THREE.glTFAnimator.add(this);
		};

		Action.prototype.move_cam_to = function(newPos) {


        };

		Action.prototype.cam_zoom_to = function(newZoom) {};

		Action.prototype.cam_run_around = function(box) {};

		return Project;
	});

})();