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
    App.dataEvolution = getJson("data/data_evolution.json");


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

        // console.log("Welcome Home ! ");
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
        // console.log("Filtre : " + filtre + "  Dept : " + dept);

        App.colorDisplay();

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
        console.log("_-_-_-_-_-_- App.displayInfoDept _-_-_-_-_-_- ");
        num_Departement = (num_Departement == "2A" || num_Departement == "2B") ? num_Departement : parseInt(num_Departement);

        var info_dept = App.getInfo(num_Departement);
        var info_france = App.getInfo(100);

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

        if (isNaN(chiffre_dept)) {
            chiffre_dept_container.empty().addClass("chiffreNC");
        } else {
            chiffre_dept_container.removeClass("chiffreNC");
            chiffre_dept_container.countTo({
                from: parseInt(chiffre_dept_container.text()) || 0,
                to: chiffre_dept,
                speed: 800,
                refreshInterval: 50,
                decimals: App.counterDecimal,
                formatter: function(value, options) {
                    return value.toFixed(options.decimals) + " <span>" + suffixe + "</span>";
                }
            });
        }

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


        // Affichage du/des Graph
        var graph_data = (App.dataInfo[App.filtre][6] != "NC" && App.dataInfo[App.filtre][6].length > 0) ? JSON.parse(App.dataInfo[App.filtre][6]) : false;
        App.displayGraph(graph_data);


        // Update ToolTip Graph
        if (graph_data) {
            var graph_data_info = [];
            var graph_data_tooltip_source = [];
            var graph_data_tooltip_url = [];
            var graph_data_tooltip_annee = [];

            // récupère les infos concernant toutes les datas et vire les doublons
            $.each(graph_data, function(index, value) {
                graph_data_info[index] = App.dataInfo[value];
                graph_data_tooltip_annee.push(App.dataInfo[value][2]);
                graph_data_tooltip_source.push(App.dataInfo[value][3]);
                graph_data_tooltip_url.push(App.dataInfo[value][4]);
            });

            graph_data_tooltip_source = _.uniq(graph_data_tooltip_source);
            graph_data_tooltip_url = _.uniq(graph_data_tooltip_url);
            graph_data_tooltip_annee = _.uniq(graph_data_tooltip_annee);
            graph_data_tooltip = _.zip(graph_data_tooltip_source, graph_data_tooltip_url, graph_data_tooltip_annee);


            // affichage des datas dans la tooltip
            var tooltip_container = App.dom.tooltip_graph.find("div:first");
            tooltip_container.empty().append("<h5>Provenance des datas</h5>");
            for (var i = 0; i < graph_data_tooltip.length; i++) {
                if (graph_data_tooltip[i][1] != "NC") {
                    tooltip_container.append("<div><p><span>Source : </span><a href=\"" + graph_data_tooltip[i][1] + "\" title=\"" + graph_data_tooltip[i][0] + "\" target=\"_blank\">" + graph_data_tooltip[i][0] + "</a></p> <p><span>Année : </span><span>" + graph_data_tooltip[i][2] + "</span></p></div>");
                } else {
                    tooltip_container.append("<div><p><span>Source : </span>" + graph_data_tooltip[i][0] + "</p> </div>");
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
        // console.log("TUTO STEP 2 : Choisissez un département svp");

        $('#rightSide .content').fadeOut(0, function() {
            $('#rightSide .tutoDepartement').fadeIn();
        });

    }

    // Prend en paramètre "data" un Array comprennant le nom des colonnes de datas à manipuler dans les graphs
    App.displayGraph = function(data) {
        App.dom.graph.empty();

        // Permet d'assembler 2 tableaux de même longueur ensemble
        // et éventuellement de convertir le premier (les chiffres) en %
        function ArrayToJSON(ArrayNumbers, ArrayLegends, ConvertInPourcent) {
            if (!_.isArray(ArrayNumbers) || !_.isArray(ArrayLegends) || ArrayNumbers.length != ArrayLegends.length) {
                alert("Problème avec les array ou leurs contenus");
            }

            var tab = [];
            var total = 0;
            $.each(ArrayNumbers, function() {
                total += this;
            });

            for (var i = 0; i < ArrayNumbers.length; i++) {
                if (ConvertInPourcent === true) {
                    var nb2pourc = ArrayNumbers[i] * 100 / total;
                    tab.push({
                        "nb": nb2pourc.toFixed(2),
                        "legende": ArrayLegends[i]
                    });
                } else {
                    tab.push({
                        "nb": ArrayNumbers[i],
                        "legende": ArrayLegends[i]
                    });
                }
            }
            return tab;
        }

        if (data) {

            App.dom.graph.append("__ OK on va jouer avec les datas suivantes  : <br/> ");

            var dataGraph = [];

            // On produit un tableau des valeurs de chaque filtre
            $.each(data, function(index, value) {
                console.log("Index : " + index + " Value : " + value + " <br/> ");
                dataGraph.push(parseFloat(App.getInfoFiltre(App.dept, value)));
            });

            App.dom.graph.append("<br/> dataGraph : " + dataGraph);

            // Pie Chart
            if (App.filtre == "Temps_acces_medecin") {
                var legendes = ["Gynécologue", "Ophtalmologiste", "Dentiste", "Infirmier"];
                dataGraph = ArrayToJSON(dataGraph, legendes);
                console.log(dataGraph);
                App.displayBarChart(dataGraph);
            }

            if (App.filtre == "Nb_medecin" || App.filtre == "Nb_gyneco" || App.filtre == "Nb_dentiste" || App.filtre == "Nb_ophtalmo" || App.filtre == "Nb_infirmier") {

                var legendes = ["Libéraux", "Salariés"];
                var pieChart = "#pieChart .pie";

                if ($(pieChart).html().trim().length == 0) {

                    App.displayPieChart(dataGraph);

                } else {

                    App.updatePieChart(dataGraph);

                }

            } else {
                $('#pieChart').hide();
            }

            // Gestion du Gauge Chart
            if (App.filtre == "Revenus_moyen_nets_par_mois") {

                var leftGauge = ".gaugeLeft";
                if ($(leftGauge).html().trim().length == 0) {
                    App.displayGaugeChart(leftGauge, dataGraph[0]);
                } else {
                    App.updateGaugeChart(leftGauge, dataGraph[0]);
                }

                var rightGauge = ".gaugeRight";
                if ($(rightGauge).html().trim().length == 0) {
                    App.displayGaugeChart(rightGauge, App.getInfoFiltre(100, "Taux_chomage"));
                } else {
                    App.updateGaugeChart(rightGauge, App.getInfoFiltre(100, "Taux_chomage"));
                }

            } else {
                App.hideGaugeChart();
            }

            // Gestion du Gauge Chart Multiple
            if (App.filtre.match(/^Age_moyen_/)) {
                var legendes = ["moins de 40 ans", "de 41 à 54 ans", "plus de 55 ans"];
                dataGraph = ArrayToJSON(dataGraph, legendes, true);

                if ($("#chartGaugeMultiple").html().trim().length == 0) {
                    App.displayGaugeChartMultiple("#chartGaugeMultiple", dataGraph);
                } else {
                    App.updateGaugeChartMultiple("#chartGaugeMultiple", dataGraph);
                }

            } else {
                App.hideGaugeChartMultiple();
            }

            // FIN -- if(data)
        } else {

            App.hideGaugeChart();
            App.hideGaugeChartMultiple();

            // Gestion Line Chart -- Exception car JSON à lire différent donc n'est pas dans la condition if(data)
            if (App.filtre == "Nb_hab_par_medecin") {

                var dataDept = _.findWhere(App.dataEvolution, {
                    Num_dpt: App.dept
                });
                var data = [
                    "data",
                    parseInt(dataDept["Nb_generaliste_2014"]),
                    parseInt(dataDept["Nb_generaliste_2015"]),
                    parseInt(dataDept["Nb_generaliste_2016"]),
                    parseInt(dataDept["Nb_generaliste_2017"]),
                    parseInt(dataDept["Nb_generaliste_2018"])
                ];
                var dataMin = _.min(data);
                var dataMax = _.max(data);


                if ($("#chartLine").html().trim().length == 0) {
                    App.displayLineChart(data, dataMin, dataMax);
                } else {
                    App.updateLineChart(data, dataMin, dataMax);
                }

            }

            App.dom.graph.append("__ ARGGGHH on n'a pas les datas ! :'( <br/> ");

        }
    }

    App.colorDisplay = function() {

        var activeFilter = App.filtre;

        var scale = App.dataInfo[activeFilter][7];
        scale = JSON.parse(scale);

        for (i = 95; i > -1; i--) {

            var data = App.data[i][activeFilter];
            var numDept = App.data[i].Num_dpt;

            //console.log(data);

            if (data == "NC") {

                d3.selectAll("#france path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#fff");

                d3.selectAll("#paris path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#fff");

            } else if (data <= scale[0]) {

                d3.selectAll("#france path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#dff0f2");

                d3.selectAll("#paris path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#dff0f2");

            } else if (data <= scale[1] && data > scale[0]) {

                d3.selectAll("#france path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#bee0e4");

                d3.selectAll("#paris path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#bee0e4");

            } else if (data <= scale[2] && data > scale[1]) {

                d3.selectAll("#france path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#8ec9d0");

                d3.selectAll("#paris path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#8ec9d0");


            } else if (data > scale[2]) {

                d3.selectAll("#france path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#63b1be");

                d3.selectAll("#paris path.departement")
                    .filter(function(d) {
                        return d.properties.CODE_DEPT == numDept;
                    })
                    .transition().duration(500)
                    .attr("fill", "#63b1be");

            }

        }

    }


    /* ********************************************************
    /   D3.JS -- BAR CHART
    / ********************************************************* */


    App.displayBarChart = function(data) {

        $('.d3-tip').remove();

        var margin = {
            top: 40,
            right: 20,
            bottom: 30,
            left: 40
        },
            width = 640 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .4);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(7);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-25, 0])
            .html(function(d) {
                return "<strong>" + parseInt(d.nb) + " " + App.dataInfo[App.filtre][5] + "</strong>";
            })

        var svg = d3.select("#graph").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "barChart")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.call(tip);

        x.domain(data.map(function(d) {
            return d.legende;
        }));
        y.domain([0, d3.max(data, function(d) {
            return parseInt(d.nb);
        })]);

        var valMax = d3.max(data, function(d) {
            return parseInt(d.nb);
        });

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "fakeXY")
            .append("line").attr({
                "x1": "0",
                "x2": "0",
                "y1": "0",
                "y2": height
            }).style("stroke", "#2b2b2b");

        svg.select(".fakeXY")
            .append("line").attr({
                "x1": "0",
                "x2": "580",
                "y1": height,
                "y2": height
            }).style("stroke", "#2b2b2b");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // affiche les bars
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) {
                return x(d.legende);
            })
            .attr("width", x.rangeBand())
            .attr("y", function(d) {
                return y(d.nb);
            })
            .attr("height", function(d) {
                return height - y(d.nb);
            })
            .style("fill", function(d) {
                var step = valMax / 4;

                if (parseInt(d.nb) == valMax) {
                    return "#22352c";
                } else if (parseInt(d.nb) < step * 4 && parseInt(d.nb) >= step * 3) {
                    return "#295741";
                } else if (parseInt(d.nb) < step * 3 && parseInt(d.nb) >= step * 2) {
                    return "#286d4c";
                } else if (parseInt(d.nb) < step * 2 && parseInt(d.nb) >= step) {
                    return "#278759";
                } else {
                    return "#219e62";
                }

            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        // ajout les triangles sous chaque bar
        svg.selectAll(".triangle")
            .data(data)
            .enter()
            .append("svg:path")
            .attr("transform", function(d) {
                return "translate(" + (x(d.legende) + x.rangeBand() / 2) + ", " + (height + 6) + ")";
            })
            .attr("d", d3.svg.symbol().type("triangle-down"))
            .style("fill", "#2b2b2b");

        // remplace les tirets par des ronds
        var ticks = svg.selectAll(".y.axis .tick");
        ticks.each(function() {
            d3.select(this).append("circle").attr("r", 4).attr("fill", "#4c4c4c");
            d3.select(this).selectAll("text").attr("x", -16);
        });
        ticks.selectAll("line").remove();

        // descend les labels
        var ticksText = svg.selectAll(".x.axis .tick");
        ticksText.each(function() {
            d3.select(this).selectAll("text").attr("y", 18);
        });

        // ajoute le trait blanc au dessus de chaque Bar
        svg.selectAll(".barTop")
            .data(data)
            .enter().append("rect")
            .attr("class", "barTop")
            .attr("x", function(d) {
                return x(d.legende);
            })
            .attr("width", x.rangeBand())
            .attr("y", function(d) {
                return y(d.nb) - 3;
            })
            .attr("height", function(d) {
                return 5;
            })

        // ajoute le cercle blanc en haut & au centre de chaque Bar
        svg.selectAll(".circleTop")
            .data(data)
            .enter().append("circle")
            .attr("class", "circleTop")
            .attr("cx", function(d) {
                return x(d.legende) + x.rangeBand() / 2;
            })
            .attr("cy", function(d) {
                return y(d.nb) - 1;
            })
            .attr("r", 8);

        // ajoute le cercle blanc transparent en haut & au centre de chaque Bar
        svg.selectAll(".circleTopTransparent")
            .data(data)
            .enter().append("circle")
            .attr("class", "circleTopTransparent")
            .attr("cx", function(d) {
                return x(d.legende) + x.rangeBand() / 2;
            })
            .attr("cy", function(d) {
                return y(d.nb) - 1;
            })
            .attr("r", 12);

    }

    /* ********************************************************
    /   D3.JS -- PIE CHART
    / ********************************************************* */

    App.displayPieChart = function(data) {

        $("#pieChart").show();

        // Initialisation des variales
        var width = 280,
            height = 280,
            radius = Math.min(width, height) / 2,
            arc = d3.svg.arc().innerRadius(radius - 10).outerRadius(radius - 45),
            pie = d3.layout.pie(),
            color = ["#264359", "#22313b"];

        // Création du SVG
        var svg = d3.select("#pieChart .pie").append("svg")
            .attr("class", "pieChart")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // Création du SVG pour la légende
        var legend = d3.select("#pieChart .pieChartLegend").append("svg")
            .attr('width', 200)
            .attr('height', 100)
            .append("g");

        // Cercle intérieur
        var circle = svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 60)
            .style("fill", "#282828");

        // On dessine les arcs
        var pathPie = svg.selectAll("path")
            .data(pie(data))
            .enter().append("path")
            .attr("fill", function(d, i) {
                return color[i];
            })
            .attr("data-nb", function(d) {
                return d.nb;
            })
            .attr("d", arc)
            .style("stroke", "#1f1e1e")
            .style("stroke-width", 5)
            .on('mouseover', function(d, i) {

                var select = String("#pieChart .rectData" + i);

                var item = $("<div class='text'>" + parseFloat(d.value) + "<span>%</span></div>").hide().fadeIn(500);
                $("#pieChart").append(item);

                $(select).animate({
                    opacity: 1
                }, 500);

                if (i == 1) {
                    d3.select(this)
                        .transition().duration(500)
                        .attr('fill', '#295677');
                } else {
                    d3.select(this)
                        .transition().duration(500)
                        .attr('fill', '#307BB2');
                }
            })
            .on('mouseleave', function(d, i) {

                $('#pieChart .text').fadeOut(500, function() {
                    $(this).remove();
                });

                var select = String("#pieChart .rectData" + i);

                $(select).animate({
                    opacity: 0
                }, 500);

                if (i == 1) {
                    d3.select(this)
                        .transition().duration(500)
                        .attr('fill', '#22313b');
                } else {
                    d3.select(this)
                        .transition().duration(500)
                        .attr('fill', '#264359');
                }

            }).each(function(d) {
                this._current = d;
            });

        legend.append("rect")
            .attr('class', 'rectData1')
            .attr("x", 10)
            .attr("y", 10)
            .attr("width", "200")
            .attr("height", "45")
            .style({
                "fill": "#282828",
                "opacity": "0"
            });
        legend.append("rect")
            .attr('class', 'rectData0')
            .attr("x", 10)
            .attr("y", 60)
            .attr("width", "200")
            .attr("height", "45")
            .style({
                "fill": "#282828",
                "opacity": "0"
            });
        legend.append("rect")
            .attr("x", 20)
            .attr("y", 25)
            .attr("width", "20")
            .attr("height", "20")
            .style({
                "fill": "#22313b",
                "stroke": "#1f1e1e",
                "stroke-width": "5"
            });
        legend.append("rect")
            .attr("x", 20)
            .attr("y", 70)
            .attr("width", "20")
            .attr("height", "20")
            .style({
                "fill": "#264359",
                "stroke": "#1f1e1e",
                "stroke-width": "5"
            });

        legend.append('line')
            .attr("x1", 50)
            .attr("x2", 100)
            .attr("y1", 35)
            .attr("y2", 35)
            .style({
                "stroke-dasharray": "3.3",
                "stroke-linecap": "round",
                "stroke": "#888888",
                "stroke-width": "1"
            });
        legend.append('line')
            .attr("x1", 50)
            .attr("x2", 100)
            .attr("y1", 80)
            .attr("y2", 80)
            .style({
                "stroke-dasharray": "3.3",
                "stroke-linecap": "round",
                "stroke": "#888888",
                "stroke-width": "1"
            });
        legend.append("text")
            .attr("x", 110)
            .attr("y", 40)
            .text(function(d) {
                return "Salariés";
            })
            .style({
                "fill": "#888888",
                "text-transform": "uppercase",
                "opacity": "1"
            });
        legend.append("text")
            .attr("x", 110)
            .attr("y", 85)
            .text(function(d) {
                return "Libéraux";
            })
            .style({
                "fill": "#888888",
                "text-transform": "uppercase",
                "opacity": "1"
            });

    }

    App.updatePieChart = function(data) {

        $("#pieChart").show();

        console.log(data);

        var width = 280,
            height = 280,
            radius = Math.min(width, height) / 2,
            arc = d3.svg.arc().innerRadius(radius - 10).outerRadius(radius - 45),
            pie = d3.layout.pie(),
            color = ["#264359", "#22313b"];

        var path = d3.selectAll("#pieChart .pie path")
            .data(pie(data))
            .attr("d", arc)
            .each(function(d) {
                $this._current = d;
            })
            .transition().duration(750)
            .attrTween("d", arcTween);

        function arcTween(d) {
            var i = d3.interpolate(this._current, d);
            console.log(i(0));
            this._current = i(0);
            return function(t) {
                return arc(i(t));
            };
        }

    }

    /* ********************************************************
    /   D3.JS -- GAUGE CHART
    / ********************************************************* */


    // Source initiale : http://bl.ocks.org/mbostock/5100636

    // Fonction avec 2 paramètres obligatoires :
    //      - 1 string  > selecteur CSS du conteneur
    //      - 1 number OU string entre 0 et 100 > pourcentage
    App.displayGaugeChart = function(container, pourcentage) {
        $('#chartGauge').show();
        var realPourcentage = parseFloat(pourcentage);
        pourcentage = parseFloat(pourcentage) / 100;
        $(container).empty();

        var width = 240,
            height = 240,
            τ = 2 * Math.PI;

        var arc = d3.svg.arc()
            .innerRadius(85)
            .outerRadius(110)
            .startAngle(0);

        var svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 96.5)
            .style({
                "fill": "transparent",
                "stroke": "#383838",
                "stroke-dasharray": "1, 15",
                "stroke-width": "3px",
                "stroke-linecap": "round"
            });

        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 52)
            .style("fill", "#282828");

        var foreground = svg.append("path")
            .attr("class", "progressionPourcentage")
            .datum({
                endAngle: pourcentage * τ
            })
            .style("fill", "#ff3636")
            .style("opacity", ".5")
            .attr("d", arc);

        var rectangle = svg.append("rect")
            .attr("x", 0)
            .attr("y", -109)
            .attr("width", 4)
            .attr("height", 24)
            .style("fill", "#FFF");

        // update des pourcentages
        $(container).append("<div class=\"pourcentage\">");
        var containerPourcentage = $(container).find(".pourcentage");

        containerPourcentage.countTo({
            from: 0,
            to: realPourcentage,
            speed: 800,
            refreshInterval: 50,
            decimals: 1,
            formatter: function(value, options) {
                return value.toFixed(options.decimals) + "<span>%</span>";
            }
        });


    }

    // Fonction avec 2 paramètres obligatoires (cf plus haut > App.displayGaugeChart)
    App.updateGaugeChart = function(container, pourcentage) {
        $('#chartGauge').show();
        var realPourcentage = parseFloat(pourcentage);
        var containerPourcentage = $(container).find(".pourcentage");
        pourcentage = parseFloat(pourcentage) / 100;


        if ($(container).length == 0) {
            console.log("/!\ Ce container (" + container + ") n'existe pas dans le DOM..");
            return false;
        }

        var arc = d3.svg.arc()
            .innerRadius(85)
            .outerRadius(110)
            .startAngle(0);

        console.log(pourcentage);

        d3.select(container + " .progressionPourcentage").transition()
            .duration(750)
            .call(arcTween, pourcentage * 2 * Math.PI);

        function arcTween(transition, newAngle) {
            transition.attrTween("d", function(d) {
                var interpolate = d3.interpolate(d.endAngle, newAngle);
                return function(t) {
                    d.endAngle = interpolate(t);
                    return arc(d);
                };
            });
        }

        // update des pourcentages
        containerPourcentage.countTo({
            from: parseFloat(containerPourcentage.text()),
            to: realPourcentage,
            speed: 800,
            refreshInterval: 50,
            decimals: 1,
            formatter: function(value, options) {
                return value.toFixed(options.decimals) + "<span>%</span>";
            }
        });

    }

    App.hideGaugeChart = function() {
        $('#chartGauge').hide();
    }

    // FIN  D3.js -- GAUGE CHART


    /* ********************************************************
    /   D3.JS -- GAUGE CHART MULTIPLE
    / ********************************************************* */


    // Fonction avec 2 paramètres obligatoires :
    //      - 1 string  > selecteur CSS du conteneur
    //      - 1 number OU string entre 0 et 100 > pourcentage
    App.displayGaugeChartMultiple = function(container, data) {
        $('#chartGaugeMultiple').show();
        $(container).empty();

        var width = 620,
            height = 450,
            τ = 2 * Math.PI,
            cercleMarge = 35,
            color = ["rgba(255,54,54,0.7)", "rgba(255,54,54,0.5)", "rgba(255,54,54,0.3)"];

        var arc = d3.svg.arc()
            .innerRadius(85)
            .outerRadius(110)
            .startAngle(0);

        var svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height);


        var graphContainer = svg.append("g").attr("transform", "translate(450,225)");

        for (var i = 0; i < data.length; i++) {
            var pourcentage = data[i]['nb'] / 100;
            var nb = data[i]['nb'];

            var arc = d3.svg.arc()
                .innerRadius(65 + (cercleMarge * i))
                .outerRadius(82 + (cercleMarge * i))
                .startAngle(0);

            graphContainer.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 74 + (cercleMarge * i))
                .style({
                    "fill": "transparent",
                    "stroke": "#383838",
                    "stroke-dasharray": "1, 15",
                    "stroke-width": "3px",
                    "stroke-linecap": "round"
                });

            graphContainer.append("path")
                .attr("class", "progressionPourcentage progressionPourcentage-" + i)
                .datum({
                    endAngle: pourcentage * τ
                })
                .style("fill", color[i])
                .attr("d", arc);
            //.attr("data-pourcentage", data[i]['nb'] );

            var rectangle = graphContainer.append("rect")
                .attr("x", 0)
                .attr("y", -(81 + (cercleMarge * i)))
                .attr("width", 4)
                .attr("height", 16)
                .style("fill", "#FFF");
        }

        graphContainer.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 43)
            .style("fill", "#282828");

        graphContainer.append("text")
            .attr("class", "pourcentageTexte")
            .attr("x", 10)
            .attr("y", 8)
            .text(function(d) {
                return "00";
            })
            .style("opacity", "0");

        graphContainer.append("text")
            .attr("class", "pourcentageSymbole")
            .attr("x", 13)
            .attr("y", 8)
            .text(function(d) {
                return "%";
            })
            .style("opacity", "0");

        var legendMargin = {
            "left": 5,
            "bottom": 40
        };
        var legend = svg.selectAll(".legend")
            .data(data)
            .enter()
            .append("g")
            .attr("transform", function(d, i) {
                return "translate( 40," + (height / 3 + i * 20) + ")";
            })
            .attr("class", function(d, i) {
                return "gaugeLegende gaugeLegende" + i;
            })
            .on("mouseover", function(d, i) {
                var nb = d.nb;
                var that = d3.select(this);

                that.style("cursor", "pointer");
                that.select("rect+rect").transition().duration(250).style("fill-opacity", "1");
                that.select("text").transition().duration(250).style("fill", "#FFF");

                graphContainer.select(".progressionPourcentage-" + i)
                    .transition().duration(250)
                    .style("fill", "rgba(255,54,54,1)");

                graphContainer.select(".pourcentageTexte")
                    .transition().duration(250)
                    .style("opacity", "1")
                    .text(function(d) {
                        var nbFinal = (nb < 10) ? "0" + Math.round(nb) : Math.round(nb);
                        return nbFinal;
                    });

                graphContainer.select(".pourcentageSymbole")
                    .transition().duration(250)
                    .style("opacity", "1");

            })
            .on("mouseout", function(d, i) {
                var that = d3.select(this);
                that.style("cursor", "initial");
                that.select("rect+rect").transition().duration(250).style("fill-opacity", "");
                that.select("text").transition().duration(250).style("fill", "#8D8D8D");

                graphContainer.select(".progressionPourcentage-" + i)
                    .transition().duration(250)
                    .style("fill", color[i])

                graphContainer.select(".pourcentageTexte")
                    .transition().duration(250)
                    .style("opacity", "0");

                graphContainer.select(".pourcentageSymbole")
                    .transition().duration(250)
                    .style("opacity", "0");
            });

        legend.append("rect")
            .attr("x", -5)
            .attr("y", function(d, i) {
                return i * legendMargin['bottom'] - 7.5;
            })
            .attr("width", "200")
            .attr("height", "35")
            .style({
                "fill": "#282828",
                "fill-opacity": "0.4"
            });

        legend.append('rect')
            .attr("x", legendMargin.left)
            .attr("y", function(d, i) {
                return i * legendMargin['bottom'];
            })
            .attr("width", "20")
            .attr("height", "20")
            .style({
                "fill": "#FF3636",
                "stroke": "#1f1e1e",
                "stroke-width": "5"
            });

        legend.append('line')
            .attr("x1", 34)
            .attr("x2", 50)
            .attr("y1", function(d, i) {
                return i * legendMargin['bottom'] + 10;
            })
            .attr("y2", function(d, i) {
                return i * legendMargin['bottom'] + 10;
            })
            .style({
                "stroke-dasharray": "2,4",
                "stroke-linecap": "round",
                "stroke": "#383838"
            });

        legend.append('text')
            .attr("x", legendMargin.left + 50)
            .attr("y", function(d, i) {
                return i * legendMargin['bottom'] + 14;
            })
            .text(function(d) {
                return d.legende
            })
            .style({
                "fill": "#8d8d8d",
                "font-size": "12px",
                "text-transform": "uppercase"
            });



    }


    App.updateGaugeChartMultiple = function(container, data) {

        $('#chartGaugeMultiple').show();

        if ($(container).length == 0) {
            console.log("/!\ Ce container (" + container + ") n'existe pas dans le DOM..");
            return false;
        }

        var cercleMarge = 35;

        for (var i = 0; i < data.length; i++) {
            var pourcentage = data[i]['nb'] / 100;

            var arc = d3.svg.arc()
                .innerRadius(65 + (cercleMarge * i))
                .outerRadius(82 + (cercleMarge * i))
                .startAngle(0);

            d3.select(container + " .progressionPourcentage-" + i).transition()
                .duration(750)
                .call(arcTween, pourcentage * 2 * Math.PI, i);
        }

        function arcTween(transition, newAngle, i) {
            transition.attrTween("d", function(d) {
                var interpolate = d3.interpolate(d.endAngle, newAngle);
                return function(t) {
                    d.endAngle = interpolate(t);
                    arc.innerRadius(65 + (cercleMarge * i));
                    arc.outerRadius(82 + (cercleMarge * i));
                    return arc(d);
                };
            });
        }

        d3.selectAll(".gaugeLegende")
            .data(data)
            .enter()
            .append("g")
            .on("mouseover", function(d, i) {

                d3.select("#chartGaugeMultiple .pourcentageTexte")
                    .transition().duration(250)
                    .style("opacity", "1")
                    .text(Math.round(d.nb));

            });


    }

    App.hideGaugeChartMultiple = function(container, data) {
        $('#chartGaugeMultiple').hide();
    }



    /* ********************************************************
    /   D3.JS -- LINE CHART
    / ********************************************************* */


    // Fonction avec 2 paramètres obligatoires :
    //      - 1 string  > selecteur CSS du conteneur
    //      - 1 number OU string entre 0 et 100 > pourcentage
    App.displayLineChart = function(data, dataMin, dataMax) {
        $('#chartLine').fadeIn();
        console.log(dataMin, dataMax);

        App.lineChart = c3.generate({
            bindto: '#chartLine',
            size: {
                height: 400,
                width: 620
            },
            padding: {
                top: 80,
                right: 40,
                bottom: 40,
                left: 80,
            },
            data: {
                x: 'x',
                columns: [
                    ['x', 2014, 2015, 2016, 2017, 2018],
                    data
                ],
                types: {
                    data: 'spline'
                },
                axes: {
                    data: 'y'
                },
                colors: {
                    data: "#338c5b"
                }
            },
            legend: {
                show: false
            }

        });

        var ticks = d3.selectAll("#chartLine .c3-axis-x .tick");
        ticks.each(function() {
            d3.select(this).append("circle").attr("r", 4).attr("fill", "#4c4c4c");
        });
        ticks.selectAll("line").remove();

        //chart.axis.max(parseInt(dataMax));
        //chart.axis.min(parseInt(dataMin));

        // chart.axis.range({
        //     max: {y: dataMin},
        //     min: {y: dataMax}
        // });

    }
    App.updateLineChart = function(data, dataMin, dataMax) {

        App.lineChart.load({
            columns: [
                data
            ]
        })
        App.lineChart.axis.max(parseInt(dataMax));
        App.lineChart.axis.min(parseInt(dataMin));


    }



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
            // console.log("Prefiltre");
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
        if ($this.parents("li").hasClass("prefiltre") == false && info != "Nombre_hopitaux") {
            // Changement URL - checkons le HASH
            // console.log('App.checkHash() from Ligne ~460');
            App.checkHash();
        }
        // Exception du menu : le nombre d'hopitaux
        // > seul filtre accessible en niveau 1
        if (info == "Nombre_hopitaux") {
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
        $(this).parent('#credits').addClass('animated fadeOut').delay(700).queue(function(next) {
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

    $(".dicoContent").mCustomScrollbar();


    /* ********************************************************
    /   Help
    / ********************************************************* */

    $('footer').on("click", "#helpLink", function(e) {
        e.preventDefault();
        $(".help").removeClass('hidden fadeOut').addClass('animated fadeIn');
    });

    $('body').on("click", ".help", function(e) {
        e.preventDefault();
        $(this).addClass('animated fadeOut').delay(700).queue(function(next) {
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

                // Callback
                mapObject.params.rendered.call();
            });

            // Cercle zoom
            var circle = $paris.append("circle")
                .attr("cx", this.params.circle.x)
                .attr("cy", this.params.circle.y)
                .attr("r", this.params.circle.r)
                .style("fill", this.params.circle.fill)
                .style("opacity", this.params.circle.opacity);

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

        },

        displayActiveDept: function(deptId) {

            // On rend acif le departement indiqué dans l'url
            d3.selectAll("#france path.departement")
                .filter(function(d) {
                    return d.properties.CODE_DEPT == deptId;
                })
                .classed("active", true);

        }

    }

    mapObject.init({

        rendered: function() {

            console.log('map rendered');

            // var hash = window.location.hash;
            // // analyse du hash actuel
            // var customRegExp = hash.match("#/filtre/([A-Za-z0-9_]+)(/dept_([0-9]{2}))?");

            // if (customRegExp[3]) {

            //     mapObject.displayActiveDept(customRegExp[3]);

            // }

            mapObject.renderZoom();

            $("#paris").css("display", "none");

        },

        zoomed: function() {
            console.log('Zoom sur paris');
        }

    });

    mapObject.render();

    Backbone.history.start();

});