$(document).ready(function() {

    /* ********************************************************
    /   Initialisation Application
    / ********************************************************* */

    window.App = {
        data: [],
        dataInfo: [],
        filtre: null,
        dept: null,
        menuEtat: ["", "", ""],
        prefiltreEtat: ["", "", "", ""],
        tuto: false,
        counterDecimal: 0,
        dom: {
            chiffre_dept: $('#chiffreDept p'),
            chiffre_france: $('#chiffreFrance p'),
            nom_dept: $('#rightSide .dept'),
            nom_filtre: $('#leftSide .content h2:first'),
            info_filtre: $('#infoFiltre > p:first'),
            tooltip_filtre: $('#infoFiltre .tooltipCSS'),
            info_graph: $('#infoGraph > p:first'),
            tooltip_graph: $('#infoGraph .tooltipCSS'),
            tuto: $('section.tuto'),
            graph: $('#rightSide #graph')
        }
    }

    /* ********************************************************
    /   RÉCUPERATION JSON
    / ********************************************************* */

    function getJson(url) {
        return JSON.parse($.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            global: false,
            async: false,
            success: function(data) {
                return data;
            }
        }).responseText);
    }

    App.data = getJson("data/data.json");
    App.dataInfo = getJson("data/data_info.json");


    /* ********************************************************
    /   BACKBONE
    / ********************************************************* */

    var Routeur = Backbone.Router.extend({

        routes: {
            "": "home",
            "accueil": "home",
            "tutoriel": "tutoriel",
            "filtre/:filtre(/dept_:dept)": "filtre"
        }

    });

    App.router = new Routeur;

    App.router.on("route:home", function() {
        App.tuto = false;
        App.dom.tuto.fadeOut();

        App.displayChoisirDept();

        console.log("Welcome Home ! ");
    });

    App.router.on("route:tutoriel", function() {
        App.tuto = true;
        App.dom.tuto
            .find('.tutoSecondStep, .tutoThirdStep').addClass('hidden').removeClass('animated fadeIn').end()
            .find('.tutoFirstStep').removeClass('hidden').addClass('animated fadeIn').end()
            .fadeIn();

        console.log("Affichage Tuto ");
    });

    App.router.on("route:filtre", function(filtre, dept) {
        App.tuto = false;
        App.dom.tuto.fadeOut();
        console.log("Filtre : " + filtre + "  Dept : " + dept);

        if (dept != "null" && (dept > 0 && dept < 96 || dept == "2A" || dept == "2B")) {
            App.displayInfoDept(dept);
        } else {
            App.displayChoisirDept();
        }

    });



    // Vue - Affiche et met à jour le menu
    // http://www.codebeerstartups.com/2012/12/how-to-use-templates-in-backbone-js-learning-backbone-js

    var Menu = Backbone.Model.extend({
        defaults: {
            dept: null,
            menu: ["", "", ""]
        }
    });

    var MenuView = Backbone.View.extend({
        el: $("#menu"),
        initialize: function() {
            this.render();
            this.model.on("change", this.render, this);
            $('#menu .right').tooltip({
                align: 'right'
            });

        },
        render: function() {
            this.data = {
                dept: App.dept || null,
                menu: App.menuEtat,
                prefiltreEtat: App.prefiltreEtat,
                prefiltre: null,
                prefixe: null

            };
            this.$el.find('div:eq(0)').html(_.template($("#menu_niveau1_2_template").html(), this.data));
            //this.$el.find('div:eq(1)').html(_.template($("#menu_niveau3_template").html(), this.data ));

        },
        events: {
            'click .prefiltre': 'prefiltre'
        },
        prefiltre: function(event) {
            this.data.prefiltre = $(event.target).parents(".prefiltre").data("prefiltre");
            this.data.prefixe = $(event.target).parents(".prefiltre").data("prefixe");
            this.$el.find('div:eq(1)').html(_.template($("#menu_niveau3_template").html(), this.data));
        }

    });

    App.menu = new Menu;
    App.menuView = new MenuView({
        model: App.menu
    });


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
        num_Departement = (num_Departement == "2A" || num_Departement == "2B") ? num_Departement : parseInt(num_Departement);

        var info_dept = App.getInfo(num_Departement);
        var info_france = App.getInfo(100);
        var container = $('#info-dep');

        // Affichage Right Side - Content
        $('#rightSide .tutoDepartement').fadeOut(1000, function() {
            $('#rightSide .content').fadeIn();
        });

        // Update Nom Dept.
        var nom_dept = info_dept.Nom_dpt;
        var nom_dept_container = $('#rightSide .dept');
        nom_dept_container.addClass('animated fadeOutDown', 600, function() {
            $(this).text(nom_dept).removeClass('fadeOutDown').addClass('fadeInUp');
        });

        // Update Chiffre Dept.
        var chiffre_dept = App.getInfoFiltre(num_Departement, App.filtre);
        var chiffre_dept_container = $('#chiffreDept p');
        var suffixe = App.dataInfo[App.filtre][5] != "NC" ? App.dataInfo[App.filtre][5] : "";

        chiffre_dept_container.countTo({
            from: parseInt(chiffre_dept_container.text()),
            to: chiffre_dept,
            speed: 800,
            refreshInterval: 50,
            decimals: App.counterDecimal,
            formatter: function(value, options) {
                return value.toFixed(options.decimals) + " <span>" + suffixe + "</span>";
            }
        });

        // Update Chiffre Dept.
        var chiffre_fra = App.getInfoFiltre(100, App.filtre);
        var chiffre_fra_container = $('#chiffreFrance p');
        chiffre_fra_container.countTo({
            from: parseInt(chiffre_fra_container.text()),
            to: chiffre_fra,
            speed: 800,
            refreshInterval: 50,
            decimals: App.counterDecimal,
            formatter: function(value, options) {
                return value.toFixed(options.decimals) + " <span>" + suffixe + "</span>";
            }
        });

        // Update Info Tooltip Provenance Données
        var tooltip_url = App.dom.tooltip_filtre.find("a");
        var tooltip_annee = App.dom.tooltip_filtre.find('p+p span+span');
        tooltip_url.attr("href", App.dataInfo[App.filtre][4]).attr("title", App.dataInfo[App.filtre][3]).text(App.dataInfo[App.filtre][3]);
        tooltip_annee.text(App.dataInfo[App.filtre][2]);

        //App.dom.nom_filtre.text( App.dataInfo[HrefActive.data('info-json')][0] );

        container.html(JSON.stringify(info_dept, null, "\t"));

        // Affichage du/des Graph
        var graph_data = (App.dataInfo[App.filtre][6] != "NC") ? JSON.parse(App.dataInfo[App.filtre][6]) : false;
        App.displayGraph(graph_data);

        // Update ToolTip Graph
        if (graph_data) {
            var graph_data_info             = [];
            var graph_data_tooltip_source   = [];
            var graph_data_tooltip_url      = [];
            var graph_data_tooltip_annee    = [];

            // récupère les infos concernant toutes les datas et vire les doublons
            $.each(graph_data, function(index, value) {
                graph_data_info[index] = App.dataInfo[value];
                graph_data_tooltip_annee.push( App.dataInfo[value][2] );
                graph_data_tooltip_source.push( App.dataInfo[value][3] );
                graph_data_tooltip_url.push( App.dataInfo[value][4] );
            });

            graph_data_tooltip_source = _.uniq(graph_data_tooltip_source);
            graph_data_tooltip_url    = _.uniq(graph_data_tooltip_url);
            graph_data_tooltip_annee  = _.uniq(graph_data_tooltip_annee);
            graph_data_tooltip        = _.zip(graph_data_tooltip_source,graph_data_tooltip_url,graph_data_tooltip_annee);


            // affichage des datas dans la tooltip
            var tooltip_container = App.dom.tooltip_graph.find("div:first");
            tooltip_container.empty().append("<h5>Provenance des datas</h5>");
            for(var i=0; i< graph_data_tooltip.length; i++){
                if(graph_data_tooltip[i][1] != "NC"){
                    tooltip_container.append("<div><p><span>Source : </span><a href=\""+graph_data_tooltip[i][1]+"\" title=\""+graph_data_tooltip[i][0]+"\" target=\"_blank\">"+graph_data_tooltip[i][0]+"</a></p> <p><span>Année : </span><span>"+graph_data_tooltip[i][2]+"</span></p></div>");
                }
                else{
                    tooltip_container.append("<div><p><span>Source : </span>"+graph_data_tooltip[i][0]+"</p> </div>");
                }
            }                

        }



    }

    App.checkHash = function() {

        //console.log("HASH ACTUEL  : " + window.location.hash);

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


        if (customRegExp) {
            console.log('on a un filtre : ' + customRegExp[1]);

            App.router.navigate("#/filtre/" + customRegExp[1] + "/dept_" + App.dept, {
                trigger: true
            });

            // + Update Menu Filtre > Active
            // + Update Titre Filtre (Left Site)
            // + Update Info filtre (Right Side)
            var HrefActive = $('#menu').find('a[href*="' + customRegExp[1] + '"]');
            if (HrefActive.length > 0) {

                App.dom.nom_filtre.text(App.dataInfo[HrefActive.data('info-json')][0]);
                HrefActive.parents("li").addClass("active");

                App.dom.info_graph.text(App.dataInfo[HrefActive.data('info-json')][1]);

            }

            if (customRegExp[3]) {

                console.log(" on a un depart. : " + customRegExp[3]);
                //App.dept = customRegExp[3];

            }

        }

    }

    App.displayChoisirDept = function() {
        console.log("TUTO STEP 2 : Choisissez un département svp");

        $('#rightSide .content').fadeOut(0, function() {
            $('#rightSide .tutoDepartement').fadeIn();
        });

    }

    // Prend en paramètre "data" un Array comprennant le nom des colonnes de datas à manipuler dans les graphs
    App.displayGraph = function(data) {
        App.dom.graph.empty();

        function ArrayToJSON(ArrayNumbers, ArrayLegends){
            if( !_.isArray(ArrayNumbers) || !_.isArray(ArrayLegends) || ArrayNumbers.length != ArrayLegends.length ){
                alert("Problème avec les array ou leurs contenus");
            }

            var tab = [];
            for(var i=0; i<ArrayNumbers.length; i++){
                tab.push( { "nb": ArrayNumbers[i] , "legende" : ArrayLegends[i] } );
            }
            return tab;
        }

        if (data) {

            App.dom.graph.append("__ OK on va jouer avec les datas suivantes  : <br/> ");

            var dataGraph = [];

            // On produit un tableau des valeurs de chaque filtre
            $.each(data, function(index, value) {
                //App.dom.graph.append("Index : " + index + " Value : " + value + " <br/> ");
                console.log("Index : " + index + " Value : " + value + " <br/> ");
                dataGraph.push( parseInt(App.getInfoFiltre(App.dept, value)) );
            });

            App.dom.graph.append("<br/> dataGraph : " + dataGraph );

            if(App.filtre == "Temps_acces_medecin"){
                var legendes = ["Gynecologue","Ophtalmogue","Dentiste","Infirmier"];
                dataGraph = ArrayToJSON(dataGraph, legendes);
                App.displayBarChart(dataGraph);
            }




            // var chart = c3.generate({
            //     bindto: '#chart',
            //     data: {
            //         columns: [
            //             ['data1', 30, 200, 100, 400, 150, 250]
            //         ],
            //         type: 'bar'
            //     },
            //     bar: {
            //         width: {
            //             ratio: 0.5 // this makes bar width 50% of length between ticks
            //         }
            //         // or
            //         //width: 100 // this makes bar width 100px
            //     }
            // });

        } else {

            App.dom.graph.append("__ ARGGGHH on n'a pas les datas ! :'( <br/> ");

        }
    }

    App.displayBarChart = function(data){
        /* 
        - TO DO : 
            couleurs
            http://stackoverflow.com/questions/17734502/rounded-values-for-color-in-d3-scale 
        */

        var margin = {top: 40, right: 20, bottom: 30, left: 40},
            width = 740 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d) {
            return "<strong>" + d.nb + " "+App.dataInfo[App.filtre][5]+"</strong>";
          })

        var svg = d3.select("#graph").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.call(tip);

          x.domain(data.map(function(d) { console.log(d); return d.legende; }));
          y.domain([0, d3.max(data, function(d) { return d.nb; })]);

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis);

          svg.selectAll(".bar")
              .data(data)
            .enter().append("rect")
              .attr("class", "bar")
              .attr("x", function(d) { return x(d.legende); })
              .attr("width", x.rangeBand())
              .attr("y", function(d) { return y(d.nb); })
              .attr("height", function(d) { return height - y(d.nb); })
              .on('mouseover', tip.show)
              .on('mouseout', tip.hide);

          
            var ticks = svg.selectAll(".y.axis .tick");
            ticks.each(function() { d3.select(this).append("circle").attr("r", 4); });
            ticks.selectAll("line").remove();

    }


    App.checkHash();


    /* ********************************************************
    /   MENU NAVIGATON
    / ********************************************************* */

    $('#menu').on("click", ".firstLevel a", function(e) {
        e.preventDefault();
        var firstLevel = $(this).parents(".firstLevel");

        firstLevel.next(".secondLevel").toggle('400').toggleClass('open');

        $(".thirdLevel").addClass('hidden');
        $(".thirdLevel ul").addClass('animated fadeOutLeft');

        //Affiche la deuxième étape du tuto
        $(".tutoSecondStep").removeClass('hidden').addClass('animated fadeIn');
        $(".tutoFirstStep").addClass('hidden');


        if (firstLevel.siblings().next(".secondLevel").hasClass('open')) {
            firstLevel.siblings().next(".secondLevel").removeClass('open');
            firstLevel.siblings().next(".secondLevel").slideUp();
        }

        // if(firstLevel.next(".secondLevel").data('has-sub-lvl') == "yes"){

        // }
        // else{
        //     $(".thirdLevel ul").removeClass('hidden');
        //     $(".thirdLevel").addClass('animated fadeOutLeft');
        // }

        // Récupère et actualise l'état du menu, pour savoir ce qui est ouvert ou non
        var status1 = ($('#menu .secondLevel').eq(0).hasClass('open')) ? "open" : "";
        var status2 = ($('#menu .secondLevel').eq(1).hasClass('open')) ? "open" : "";
        var status3 = ($('#menu .thirdLevel').hasClass('open')) ? "open" : "";
        App.menuEtat = [status1, status2, status3];

    });

    $('#menu').on("click", ".secondLevel li a", function(e) {
        e.preventDefault();
        var $this = $(this);
        var url = $this.attr("href");
        var li = $this.parents("li");
        var info = $this.data('info-json');

        // Affiche la deuxième étape du tuto
        $(".tutoSecondStep").addClass('hidden');


        $('#menu ul li').removeClass('active');
        li.addClass('active');


        if (li.hasClass('prefiltre') == true) {
            console.log("Prefiltre");
            App.prefiltreEtat = ["", "", "", ""];
            App.prefiltreEtat[li.index()] = "active";
            App.counterDecimal = li.data('counter-decimal');

            $(".thirdLevel").addClass('open');

            // Affiche la troisieme étape du tuto
            $(".tutoThirdStep").removeClass('hidden').addClass('animated fadeIn');

            // $(".thirdLevel ul").removeClass('hidden');
            // $(".thirdLevel").addClass('animated fadeInLeft');
        } else {
            $('.tuto').fadeOut();

            App.counterDecimal = $this.data('counter-decimal');
            App.filtre = info;
            App.router.navigate(url, {
                trigger: true
            });
        }

    });

    $('#menu').on("click", ".thirdLevel li a", function(e) {
        e.preventDefault();

        $('.tuto').fadeOut();

        var $this = $(this);
        var url = $this.attr("href");
        var li = $this.parents("li");
        var info = $this.data("info-json");

        li.siblings().removeClass("active").find("a").removeClass("selected");
        li.addClass("active");
        $this.addClass("selected");

        App.filtre = info;
        App.router.navigate(url, {
            trigger: true
        });

    });

    $('#menu').on("click", "li a", function(e) {
        $this = $(this);
        var info = $this.data("info-json");

        // Vérifions que nous ne sommes pas sur un préfiltre OU notre exception
        if($this.parents("li").hasClass("prefiltre") == false && info != "Nombre_hopitaux"){
            // Changement URL - checkons le HASH
            console.log('App.checkHash() from Ligne ~460');
            App.checkHash();
        }
        // Exception du menu : le nombre d'hopitaux
        // > seul filtre accessible en niveau 1
        if(info == "Nombre_hopitaux"){
            e.preventDefault();
            $this.parents("li").addClass("active");
            App.counterDecimal = $this.data("counter-decimal");
            App.filtre = info;
            App.router.navigate($this.attr("href"), {
                trigger: true
            });
            App.checkHash();
        }


    });


    $('.splashscreen').on("click", ".presentation a", function(e) {
        e.preventDefault();
        $(this).parents(".splashscreen").fadeOut("slow");
        $("#rightSide").fadeIn("slow");

        App.router.navigate($(this).attr("href"), {
            trigger: true
        });
    });

    /* ********************************************************
    /   TUTO
    / ********************************************************* */

    $('.tutoLeftSide').on("click", "a", function(e) {

        //App.router.navigate( $(this).attr("href") , { trigger: true });

    });

    /* ********************************************************
    /   CREDIT
    / ********************************************************* */

    $('footer').on("click", "#creditLink", function(e) {
        e.preventDefault();
        $("#credits").removeClass('hidden fadeOut').addClass('animated fadeIn');
    });

    $('body').on("click", ".credits", function(e) {
        e.preventDefault();
        $(this).parent('#credits').addClass('animated fadeOut').delay(800).queue(function(next) {
            $(this).addClass('hidden');
            next();
        });
    });


    /* ********************************************************
    /   Dico
    / ********************************************************* */

    $('footer').on("click", "#dicoLink", function(e) {
        e.preventDefault();
        $(".dico").removeClass('hidden fadeOut').addClass('animated fadeIn');
    });
    $('.dico').on("click", ".dicoClose", function(e) {
        e.preventDefault();

        $(".dico").addClass('animated fadeOut').delay(1000).queue(function(next) {
            $(this).addClass('hidden');
            next();
        });
    });

    /* ********************************************************
    /   Help
    / ********************************************************* */

    $('footer').on("click", "#helpLink", function(e) {
        e.preventDefault();
        $(".help").removeClass('hidden fadeOut').addClass('animated fadeIn');
    });

    $('body').on("click", ".help", function(e) {
        e.preventDefault();
        $(this).addClass('animated fadeOut').delay(800).queue(function(next) {
            $(this).addClass('hidden');
            next();
        });
    });


    /* ********************************************************
	/ 	D3 MAP
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
            color: '#e7f0f3',
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
                opacity: '.7'
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

                        mapObject.clickOnRegion(d, this);

                        //App.router.navigate("#/filtre/nb_habitants_plus_60_ans/dept_14", {trigger: true});

                        d3.selectAll("path.departement").classed("active", false);
                        d3.select(this).classed("active", true);
                    });
            });

            // Cercle zoom
            var circle = $paris.append("circle")
                .attr("cx", this.params.circle.x)
                .attr("cy", this.params.circle.y)
                .attr("r", this.params.circle.r)
                .style("fill", this.params.circle.fill)
                .style("opacity", this.params.circle.opacity);

            // Callback
            mapObject.params.rendered.call();

        },

        cursorOverRegion: function(d) {

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
                    .attr('fill', "#e7f0f3")
                    .attr('d', $path)
                    .attr('data-code-dep', function(d) {
                        return d.properties.CODE_DEPT;
                    })
                    .attr("data-id-dep", function(d) {
                        return d.properties.ID_GEOFLA;
                    })
                    .on("click", function(d) {

                        $depData = d3.select(this).attr("data-code-dep");

                        mapObject.clickOnRegion(d);

                        d3.selectAll("path.departement").classed("active", false);
                        d3.select(this).classed("active", true);

                        // On rend acif le departement cliqué a partir du zoom
                        d3.selectAll("#france path.departement")
                            .filter(function(d) {
                                return d.properties.CODE_DEPT == $depData;
                            })
                            .classed("active", true);

                    });

            });

            mapObject.zoomParis();

        },

        clickOnRegion: function(d) {

            /* _____________ DEBUT AJOUT FLORENT - A GARDER _____________________________________ */
            App.dept = d.properties.CODE_DEPT;
            // modification du modèle et donc des liens du menu
            App.menu.set({
                dept: App.dept,
                menu: App.menuEtat
            });
            App.checkHash();
            /* _____________ FIN   AJOUT FLORENT - A GARDER _____________________________________ */
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

    Backbone.history.start();

});