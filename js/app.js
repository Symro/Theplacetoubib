$(document).ready(function(){


		/* ******************************************************** 
		/ 	D3 MAP 													
		/ ********************************************************* */

        var width = 800;
        var height = 700;

        // Création objet path pour manipuler les données geographiques
        var path = d3.geo.path();

        // On définit les propriétés de la projection à utiliser
        var projection = d3.geo.conicConformal()
          .center([2.454071, 47.279229]) // On centre la carte sur la France
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
              .attr('fill',"#3498db")
              .attr("d", path)
              .attr('data-code-dep', function(d){
                // TEMPORAIRE : 
                // juste pour monter comment manipuler les datas
                // ajouter des classes ou data attributs avec D3.js..
                return d.properties.CODE_DEPT;
              })
              .attr("data-id-dep", function(d){
                return d.properties.ID_GEOFLA;
              })
              .on("mouseover", function (d){
                  // Affichage brute des infos concernant le département au survol
                  var data = "Departement : "+d.properties.NOM_DEPT+" ( "+d.properties.CODE_DEPT+" ) ";
                  document.getElementById("info-dep").innerHTML = data;
              })
        });


});
