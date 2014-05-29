$(document).ready(function() {


    /* ********************************************************
    /   BACKBONE
    / ********************************************************* */

    window.App = {
        data        : [],
        filtre      : null,
        dept        : null,
        menuEtat    : ["","",""],
        dom         : {

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
        "filtre/:filtre(/dept_:dept)": "filtre"
      }

    });

    App.router = new Routeur;

    App.router.on("route:home", function() {
        console.log("Welcome Home ! ");
    });

    App.router.on("route:filtre", function(filtre, dept) {
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

    // Vue - Affiche et met à jour le menu
    // http://www.codebeerstartups.com/2012/12/how-to-use-templates-in-backbone-js-learning-backbone-js

    var Menu = Backbone.Model.extend({
        defaults:{
            dept:null,
            menu:["","",""]
        }
    });

    var MenuView = Backbone.View.extend({
        el : $("#menu"),
        initialize: function () {
            //pass model:your_model when creating instance
            this.render();
            this.model.on("change", this.render, this);
        },
        render: function(){
            var data = { 
                dept : App.dept || null,
                menu : App.menuEtat
            };
            this.$el.html( _.template( $("#menu_template").html(), data ) );
        }

    });

    App.menu = new Menu;
    App.menuView = new MenuView({model:App.menu});


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

    App.checkHash = function(){

        console.log("HASH ACTUEL  : "+window.location.hash);

        var hash = window.location.hash;
        // analyse du hash actuel
        var customRegExp = hash.match("#/filtre/([A-Za-z0-9_]+)(/dept_([0-9]{2}))?");

        // si notre url contient au minimum "#/filtre/"+quelque chose
        // on analyse la situation :

        // l'utilisateur a cliqué sur un departement car (App.dept != null)
        //  > A t-on un filtre actif & valide ?
        // 
        // 
        // l'utilisateur n'a pas cliqué > URL direct donc..
        //  > Affichage du filtre et dept de l'URL


        if(customRegExp){
            console.log('on a un filtre : '+customRegExp[1]);

            App.router.navigate("#/filtre/"+customRegExp[1]+"/dept_"+App.dept, {trigger: true});

            if(customRegExp[3]){
                console.log(" on a un departement dans l'URL : "+customRegExp[3]);
                //App.router.navigate("#/filtre/"+customRegExp[1]+"/dept_"+customRegExp[3], {trigger: true});
            }
        }

    }

    App.checkHash();



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
                // App.displayInfoDept(d.properties.CODE_DEPT);

/* _____________ DEBUT AJOUT FLORENT - A GARDER _____________________________________ */
                App.dept = d.properties.CODE_DEPT;
                // modification du modèle et donc des liens du menu
                App.menu.set({dept: d.properties.CODE_DEPT, menu: App.menuEtat});
                App.checkHash();
/* _____________ FIN   AJOUT FLORENT - A GARDER _____________________________________ */

                //App.router.navigate("#/filtre/nb_habitants_plus_60_ans/dept_14", {trigger: true});

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



    


    Backbone.history.start();

});