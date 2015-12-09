(function() {
	angular.module('Aho').factory('Project', function($http, $q, $mdDialog, Editor) {
		var slideCount = 0;
		var Project = {};
        var vcamCount = 0;

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
                  
                  
        Project.playSlide = 0;

        Project.cameras = {};
		Project.slides = [];
        Project.camSlide = null;// camera duoc gan voi slide hien tai
		Project.playSlide = 0;
		Project.actions = [];
		Project.activeCam = Editor.camera;

		Project.activeSlide = null;
        Project.camSelected = null; // dropdown
        Project.tab1Selected = 0;
        Project.tab2Selected = 0;
        Project.texturePath = '';        

        Project.botText =  "Bạn chưa chọn đối tượng nào!";


        Editor.signals.objectAdded.add(function (object)
        {
            if (object instanceof THREE.PerspectiveCamera) {
                if (object.name[0]!='V') { // neu ko phai VCam, cho vao danh sach camera cua slide
                    Project.cameras[object.uuid] = object;
                    Project.tab1Selected = 2;
                }
            } 
        }
        );

        Editor.signals.vcamMove.add(function() {
            var lookAt = Project.activeCam.translateZ();
        });

        Editor.signals.objectSelected.add(function (object) {
            Project.getObjInfo(object);
        });        

        Editor.signals.cameraSelected.add(function (cam)
        {
            Project.tab2Selected = 1;
        }
        );        

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
                // Project.slides.push(JSON.parse(data))                
            } else if (data.metadata.type.toLowerCase() === 'action') {
                // Project.actions.push(JSON.parse(data))                
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

        Project.playAll = function() {
            for ( var s = 0; s < Project.slides.length; s ++ ) {
                Project.slides[s].play();
            }
        }
        Project.stopAll = function() {
            TWEEN.removeAll();
        }

        Project.slideClick = function(slide) {
            Project.activeSlide = slide;            
            // Project.tab1Selected = 1;

            if (Project.activeSlide.camera_id != 0) {
                var cam = Project.cameras[Project.activeSlide.camera_id];
                Editor.camera.position.copy( cam.position );
                Editor.camera.rotation.copy( cam.rotation );
                Editor.camera.aspect = cam.aspect;
                Editor.camera.near = cam.near;
                Editor.camera.far = cam.far;         
                Editor.camSlide = cam;
                Editor.signals.cameraChanged.dispatch();
                Editor.select(cam);
                // Editor.signals.cameraSelected.dispatch(cam);                    
            } 
            if (slide.camera_id==0) {
                Project.tab2Selected = 0;
            }
        }

        Project.cameraClick = function(cam) {
            Project.activeCam = cam;
            Project.tab2Selected = 1;
            Editor.select(cam);   
            // Editor.signals.cameraSelected.dispatch(cam);            
        }

        Project.clear = function() {
            Editor.camera.position.set( 500, 250, 500 );
            Editor.camera.lookAt( new THREE.Vector3() );

            var objects = Editor.scene.children;


            while ( objects.length > 0 ) {
                Editor.removeObject( objects[ 0 ] );
            }

            Project.actions = [];
            Project.slides = [];

            Editor.geometries = {};
            Editor.materials = {};
            Editor.textures = {};
            Editor.scripts = {};

            Project.activeSlide = null;
            slideCount = 0;

            Editor.deselect();
            Editor.signals.editorCleared.dispatch();            
        }

        Project.newProject = function() {
            function NewPDiagController($scope, $mdDialog) {
              $scope.data = 0;
              $scope.hide = function() {
                $mdDialog.hide();
              };
              $scope.cancel = function() {
                $mdDialog.cancel();
              };
              $scope.clickOk = function(choice) {                
                $mdDialog.hide(choice);
              };
            }

            $mdDialog.show({
                  controller: NewPDiagController,
                  templateUrl: 'app/Aho/views/project-add-dialog.tmpl.html',
                  parent: angular.element(document.body),
                  clickOutsideToClose:true                    
                }).then(function(choice){

                    if ( confirm( 'Bạn có thể mất dữ liệu chưa lưu. Bạn vẫn muốn tạo dự án mới?' ) ) {
                        Project.clear();
                    }        
                    // Project.clear();            
                    var file_name = '';
                    switch (choice) {
                        case 0:     
                            
                            break;
                        case 1:
                            break;    
                        case 2:                        
                            break;
                    default:
                            alert('false');
                            break;
                    };        
                });              
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
            newSlide = new Slide({                 
                    sname: 'Trình diễn ' + slideCount,
                    time_start:time_start,
                    time_end:time_end
            });
			// Project.slides[newSlide.uuid] = newSlide;
            Project.slides.push(newSlide) ;
            if (Project.tab1Selected!=0) Project.tab1Selected = 0;
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
                    adata.position = Editor.camera.position;           
                    break;
                case 1:   

                    break;
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
                        console.log(Project.actions);
                        Project.activeSlide.time_end += duration;
                    });                
            }

        }

        Project.getObjInfo = function(object) {

            if (object!=null) {
                Project.botText = 'Đối tượng chọn['+object.name+']:';

                if (object instanceof THREE.PerspectiveCamera) {
                    Project.botText+= ',X= ' +object.position.x ;
                    Project.botText+= ',Y= ' +object.position.y ;
                    Project.botText+= ',Z= ' +object.position.z ;                    
                    Project.botText+= ',Near= ' +object.near ;                    
                    Project.botText+= ',Far= ' +object.far ;                    
                }
            } else {
                Project.botText = "Bạn chưa chọn đối tượng nào!"
            }
            console.log(Project.botText);            
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
            this.camera_id = 0;
            Project.activeSlide = this;
		};

        Slide.prototype.play = function() {
            var cam = Project.cameras[this.camera_id];
            // var currentPos = {x:cam.x,y:cam.y,z:cam.z,rx:cam.rotation.x,ry:cam.rotation.y,rz:cam.rotation.z};
            var currentPos = {x:cam.position.x,y:cam.position.y,z:cam.position.z};
            console.log(currentPos);
            Editor.camera.position.copy( cam.position );
            Editor.camera.rotation.copy( cam.rotation );            
            for(var a in Project.actions){ 
                var aa = Project.actions[a];
                if (aa.atype.id == 0) {
                        new TWEEN.Tween( Editor.camera.position )
                        .to({x: aa.adata.x, y: aa.adata.y, z: aa.adata.z}, 2000 )
                        // .onUpdate(function() {
                        //     console.log(this.x);
                        // })
                        .easing( TWEEN.Easing.Exponential.InOut )
                        .start();
                }
            }
        }        


		Action = function(atype_id, start_time, duration, adata) {
            this.uuid = THREE.Math.generateUUID();
			this.atype = Project.atypes[atype_id]; // move to point, zoom to point, run around object,
			this.duration = duration;
			this.loop = false;
			this.start_time = start_time;
            this.adata = {x:adata.position.x,y:adata.position.y,z:adata.position.z};
            this.type = 'action';

            var geometry = new THREE.BoxGeometry( 5, 5, 5 );
            var material = new THREE.MeshBasicMaterial( { color: this.atype.color, visible: true } );                    
            var zhelper = new THREE.Mesh( geometry, material );
            zhelper.position.copy(adata.position); 
            Editor.sceneHelpers.add( zhelper );
            
            var cam = new THREE.PerspectiveCamera( 50, 1, 1, 2000 );
            vcamCount++;
            cam.name = 'Vcam-'+vcamCount;
            cam.position.copy(Editor.camera.position);
            cam.lookAt(new THREE.Vector3());

            Editor.zhelpers[cam.uuid] = zhelper;
            Editor.addObject( cam );
            Editor.select( cam );
            
            if (Project.activeSlide!=null)
                this.id_slide = Project.activeSlide.uuid;        

            // Editor.signals.sceneGraphChanged.dispatch();    
		};

		Action.prototype.play = function(t) {

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