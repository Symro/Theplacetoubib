$(document).ready(function() {

    /* ********************************************************
	/ 	D3 MAP Orienté Objet
	/ ********************************************************* */

    var mapObject = {

        defaults: {
            map: '#map',
            width: 800,
            height: 800,
            center: {
                x: 2.454071,
                y: 47.279229
            },
            scale: 4000,
            color: '#3498db',
            widthParis: 200,
            heightParis: 200,
            centerParis: {
                x: 2.454071,
                y: 47.279229
            },
            scaleParis: 30000,
            translate: {
                x: 430,
                y: 1040
            },
            circle: {
                x: 400,
                y: 300,
                r: 100,
                stroke: '#000',
                fill: 'white',
                strokeWidth: '2',
                opacity: '.4'
            }
        },

        init: function(options) {

            this.params = $.extend(this.defaults, options);

            // Création objet path pour manipuler les données geographiques
            $path = d3.geo.path();

            // On définit les propriétés de la projection à utiliser
            var projection = d3.geo.conicConformal()
                .center([this.params.center.x, this.params.center.y])
                .scale(this.params.scale)
                .translate([this.params.height / 2, this.params.width / 2]);

            // On assigne la projection au path
            $path.projection(projection);

            // Création du svg
            $svg = d3.select(this.params.map).append("svg")
                .attr("width", this.params.width)
                .attr("height", this.params.height);

            // Création d'un groupe qui réuni tous les départements
            $fra = $svg
                .append("g")
                .attr("id", "france");

            // Groupe pour le zoom sur carte
            $paris = $svg.append("g")
                .attr("id", "paris")
                .on("mouseleave", function() {
                    $("#paris").css("display", "none");
                });

        },

        // Affichage map
        render: function() {

            // On récupère les données JSON
            d3.json('data/france.json', function(req, geojson) {

                // On récupère le path de chaque entrée du tableau
                $features = $fra
                    .selectAll("path")
                    .data(geojson.features);

                // ColorScale pour plus tard ce qui permet d'assigner une couleur de fond pour chaque departement
                var colorScale = d3.scale.category20c();

                // Pour chaque entrée du tableau on ajoutes plusieurs attributs
                $features.enter()
                    .append("path")
                    .attr('class', 'departement')
                    .attr('fill', mapObject.params.color)
                    .attr("d", $path)
                    .attr('data-code-dep', function(d) {
                        // TEMPORAIRE :
                        // juste pour monter comment manipuler les datas
                        // ajouter des classes ou data attributs avec D3.js..
                        return d.properties.CODE_DEPT;
                    })
                    .attr("data-id-dep", function(d) {
                        return d.properties.ID_GEOFLA;
                    })
                    .on("mouseover", function(d) {
                        mapObject.cursorOverRegion(d);
                    })
                    .on("click", function(d) {
                        // mapObject.clickOnRegion(d);
                        // Appel la fonction d'affiche des infos du dept.
                        App.displayInfoDept(d.properties.CODE_DEPT);

                        d3.selectAll("path.departement").classed("active", false);
                        d3.select(this).classed("active", true);
                    })
            });

            // Cercle zoom
            var circle = $paris.append("circle")
                .attr("cx", this.params.circle.x)
                .attr("cy", this.params.circle.y)
                .attr("r", this.params.circle.r)
                .style("stroke", this.params.circle.stroke)
                .style("fill", this.params.circle.fill)
                .style("stroke-width", this.params.circle.strokeWidth)
                .style("opacity", this.params.circle.opacity);

            // Callback
            mapObject.params.rendered.call();

        },

        cursorOverRegion: function(d) {
            // Affichage brute des infos concernant le département au survol
            var data = "Departement : " + d.properties.NOM_DEPT + " ( " + d.properties.CODE_DEPT + " ) ";
            document.getElementById("info-dep-survol").innerHTML = data;

            // Appel de fonction pour un zoom sur Paris
            if (d.properties.CODE_DEPT == 75 || d.properties.CODE_DEPT == 92 || d.properties.CODE_DEPT == 93 || d.properties.CODE_DEPT == 94) {
                mapObject.renderZoom();
            }
        },

        renderZoom: function() {

            // On définit les propriétés de la projection à utiliser
            var projectionParis = d3.geo.conicConformal()
                .center([this.params.centerParis.x, this.params.centerParis.y])
                .scale(this.params.scaleParis)
                .translate([this.params.translate.x, this.params.translate.y]);

            $path.projection(projectionParis);

            d3.json('data/paris.json', function(req, geojson) {

                // On récupère le path de chaque entrée du tableau
                var features = $paris
                    .selectAll("path")
                    .data(geojson.features);

                var colorScale = d3.scale.category20c();

                features.enter()
                    .append("path")
                    .attr('class', 'departement')
                    .attr('fill', "#3498db")
                    .attr('d', $path)
                    .attr('data-code-dep', function(d) {
                        return d.properties.CODE_DEPT;
                    })
                    .attr("data-id-dep", function(d) {
                        return d.properties.ID_GEOFLA;
                    })
                    .on("mouseover", function(d) {
                        // Affichage brute des infos concernant le département au survol
                        var data = "Departement : " + d.properties.NOM_DEPT + " ( " + d.properties.CODE_DEPT + " ) ";
                        document.getElementById("info-dep-survol").innerHTML = data;
                    })
                    .on("click", function(d) {
                        // Appel la fonction d'affiche des infos du dept.
                        App.displayInfoDept(d.properties.CODE_DEPT);

                        d3.selectAll("path.departement").classed("active", false);
                        d3.select(this).classed("active", true);
                    });

            });

            mapObject.zoomParis();

        },

        zoomParis: function() {

            $("body #paris").css("display", "inline");

            // Callback
            mapObject.params.zoomed.call();

        }
    }

    mapObject.init({

        rendered: function() {
            console.log('map rendered');
        },

        zoomed: function() {
            console.log('Zoom sur paris');
        }

    });

    mapObject.render();

    /* ********************************************************
      /   BACKBONE
      / ********************************************************* */

    window.App = {
        data: []
    }

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
            // console.log('Collection fetch success', response);
            // console.log('Collection models: ', collection.models);
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
            // console.log('DataListView.render()');
            var self = this;
            this.$el.append('<ul></ul>');
            _(this.collection.models).each(function(item) {
                console.log('model: ', item)
                self.appendItem(item);
            }, this);
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
        var info = App.getInfo(num_Departement);
        var container = $('#info-dep');

        container.html(JSON.stringify(info, null, "\t"));

    }

});