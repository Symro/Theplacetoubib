$(document).ready(function() {


    /* ********************************************************
	/ 	D3 MAP
	/ ********************************************************* */

    var width = 800;
    var height = 700;

    // Création objet path pour manipuler les données geographiques
    var path = d3.geo.path();

    // On définit les propriétés de la projection à utiliser
    var projection = d3.geo.conicConformal()
        .center([2.454071, 47.279229])
        .scale(4000)
        .translate([width / 2, height / 2]);

    path.projection(projection); // On assigne la projection au path

    // Création du svg
    var svg = d3.select('#map').append("svg")
        .attr("width", width)
        .attr("height", height);

    // Création d'un groupe qui réuni tous les départements
    var fra = svg
        .append("g")
        .attr("id", "france");

    // On récupère les données JSON
    d3.json('data/france.json', function(req, geojson) {

        // On récupère le path de chaque entrée du tableau
        var features = fra
            .selectAll("path")
            .data(geojson.features);

        // ColorScale pour plus tard ce qui permet d'assigner une couleur de fond pour chaque departement
        var colorScale = d3.scale.category20c();

        // Pour chaque entrée du tableau on ajoutes plusieurs attributs
        features.enter()
            .append("path")
            .attr('class', 'departement')
            .attr('fill', "#3498db")
            .attr("d", path)
            .attr('data-code-dep', function(d) {
                // ajouter des classes ou data attributs avec D3.js..
                return d.properties.CODE_DEPT;
            })
            .on("mouseover", function(d) {
                // Appel de fonction pour un zoom sur Paris
                if (d.properties.CODE_DEPT == 75 || d.properties.CODE_DEPT == 92 || d.properties.CODE_DEPT == 93 || d.properties.CODE_DEPT == 94) {
                    zoomParis();
                }
            })
            .on("click", function(d) {
                // Appel la fonction d'affiche des infos du dept.
                App.displayInfoDept(d.properties.CODE_DEPT);

                d3.selectAll("path.departement").classed("active", false);
                d3.select(this).classed("active", true);

            })
    });

    function zoomParis() {

        var width = 200,
            height = 200;

        // On définit les propriétés de la projection à utiliser
        var projection = d3.geo.conicConformal()
            .center([2.454071, 47.279229])
            .scale(30000)
            .translate([440, 990]);

        path.projection(projection);

        console.log('hover sur paris' + width);
        var paris = svg.append("g")
            .attr("id", "paris")
            .on("mouseleave", function() {
                console.log($("#paris").remove());
            });

        var circle = paris.append("circle")
            .attr("cx", 410)
            .attr("cy", 250)
            .attr("r", 100)
            .style("stroke", "#000")
            .style("fill", "white")
            .style("stroke-width", "2")
            .style("opacity", ".4");

        d3.json('data/paris.json', function(req, geojson) {

            // On récupère le path de chaque entrée du tableau
            var features = paris
                .selectAll("path")
                .data(geojson.features);

            var colorScale = d3.scale.category20c();

            features.enter()
                .append("path")
                .attr('class', 'departement')
                .attr('fill', "#3498db")
                .attr('d', path)
                .attr('data-code-dep', function(d) {
                    return d.properties.CODE_DEPT;
                })
                .attr("data-id-dep", function(d) {
                    return d.properties.ID_GEOFLA;
                })
                .on("mouseover", function(d) {
                    // Affichage brute des infos concernant le département au survol
                    // var data = "Departement : " + d.properties.NOM_DEPT + " ( " + d.properties.CODE_DEPT + " ) ";
                    // document.getElementById("info-dep-survol").innerHTML = data;
                })
                .on("click", function(d) {
                    // Appel la fonction d'affiche des infos du dept.
                    App.displayInfoDept(d.properties.CODE_DEPT);

                    d3.selectAll("path.departement").classed("active", false);
                    d3.select(this).classed("active", true);
                });

        });

    }



    /* ********************************************************
      /   BACKBONE
      / ********************************************************* */

    window.App = {
        data    : [],
        filtre  : null,
        dept    : null,
        dom     : {
            chiffre_dept    : $('#chiffreDept p'),
            chiffre_france  : $('#chiffreFrance p'),
            nom_dept        : $('#rightSide .dept'),
            nom_filtre      : $('#leftSide .content h2:first'),
            info_filtre     : $('#infoFiltre p'),

        }
    }

    var Routeur = Backbone.Router.extend({

      routes: {
        "": "home",
        "filtre/:filtre" : "filtre",
        "filtre/:filtre/dept:dept": "filtreAndDept"
      }

    });

    App.router = new Routeur;

    App.router.on("route:home", function() {
        console.log("Welcome Home ! ");
    });

    App.router.on("route:filtre", function(filtre) {
        console.log("Filtre "+filtre);
    });

    App.router.on("route:filtreAndDept", function(filtre, dept) {
        console.log("Filtre : "+filtre+"  Dept : "+dept);
    });


    // Modèle - Data
    var Data = Backbone.Model.extend();

    // Collection - Parcours les datas
    var DataList = Backbone.Collection.extend({

        model: Data,
        url: 'data/data.json',

        initialize: function() {
            this.fetch({
                success: this.fetchSuccess,
                error: this.fetchError
            });
        },

        fetchSuccess: function(collection, response) {
            App.data = response;
            console.log('Collection fetch success', response);
            console.log('Collection models: ', collection.models);
        },

        fetchError: function(collection, response) {
            throw new Error("Datas fetch error");
        }

    });

    // Vue - Affiche les datas
    // .. ou pas !?
    // http://stackoverflow.com/questions/19476317/backbone-collection-fetches-data-but-doesnt-set-models

    var DataView = Backbone.View.extend({

        tagname: 'li',

        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },

        render: function() {
            this.$el.html(this.model.get('Nom_dpt') + ': ' + this.model.get('Num_dpt'));
            return this;
        }

    });

    var DataListView = Backbone.View.extend({

        el: $('body'),
        initialize: function() {
            _.bindAll(this, 'render');

            this.collection = new DataList();
            this.collection.bind('reset', this.render)
            this.collection.fetch();
            this.render();

        },
        render: function() {
            console.log('DataListView.render()');
            // var self = this;
            // this.$el.append('<ul></ul>');
            // _(this.collection.models).each(function(item) {
            //     console.log('model: ', item)
            //     self.appendItem(item);
            // }, this);
        }

    });

    var listView = new DataListView();


    // Récupère les datas d'un département
    App.getInfo = function(num_Departement) {
        num_Departement = (typeof(num_Departement) != "string") ? num_Departement.toString() : num_Departement;
        return _.findWhere(App.data, {
            Num_dpt: num_Departement
        });
    }

    // Récupère la data d'un filtre en particulier pour un departement
    App.getInfoFiltre = function(num_Departement, filtre) {
        num_Departement = (typeof(num_Departement) != "string") ? num_Departement.toString() : num_Departement;
        filtre = (typeof(filtre) != "string") ? filtre.toString() : filtre;
        return _.findWhere(App.data, {
            Num_dpt: num_Departement
        })[filtre];
    }

    // Affiche les infos d'un departement
    App.displayInfoDept = function(num_Departement) {
        var info_dept   = App.getInfo(num_Departement);
        var info_france = App.getInfo(100);
        var container = $('#info-dep');

        // Update Nom Dept.
        var nom_dept = info_dept.Nom_dpt;
        var nom_dept_container = $('#rightSide .dept');
        nom_dept_container.addClass('animated fadeOutDown', 600, function(){
            $(this).text(nom_dept).removeClass('fadeOutDown').addClass('fadeInUp');
        });

        // Update Chiffre Dept.
        var chiffre_dept = parseInt(info_dept.Nb_hab_plus_60_ans);
        var chiffre_dept_container = $('#chiffreDept p');
        chiffre_dept_container.countTo({from: parseInt(chiffre_dept_container.text()), to: chiffre_dept});

        // Update Chiffre Dept.
        var chiffre_fra = parseInt(info_france.Nb_hab_plus_60_ans);
        var chiffre_fra_container = $('#chiffreFrance p');
        chiffre_fra_container.countTo({from: parseInt(chiffre_fra_container.text()), to: chiffre_fra});



        container.html(JSON.stringify(info_dept, null, "\t"));

    }



    Backbone.history.start();

});