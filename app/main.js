require.config({
  baseDir: 'app',
  shim : {
    bootstrap : {
      deps : ['jquery']
    }
  },
  paths: {
    jquery: 'vendor/jquery/dist/jquery',
    bootstrap: 'vendor/bootstrap/dist/js/bootstrap',
    handlebars: 'vendor/handlebars/handlebars',
    d3: 'vendor/d3/d3'
  }
});

require(['jquery', 'bootstrap', 'handlebars', 'd3'], function($, bootstrap, Handlebars, d3) {
  d3.csv('app/csv/fwk-infographic.csv')
    .get(function(err, rows) {
      if ( err ) throw err;
      var m = {};
      // get unique elements in order
      var order = rows.map(function(r) {
        return r.bucket;
      }).filter(function(a,i,all) {
        return i == 0 ? true : all[i-1] !== a;
      });
      rows.forEach(function(row) {
        var a = m[row.bucket] || [];
        a.push(row);
        m[row.bucket] = a;
      });
      var render = function() {
        var page = $('#page');
        page.empty();
        var template = Handlebars.compile($('#grp-tmpl').html());
        order.forEach(function(grp) {
          page.append(template({ groupName: grp.replace(/-/g, ' '), frameworks: m[grp] }));
        });
      };
      render();


    });


  // http://bl.ocks.org/mbostock/1705868
  var width = 500, height = 500;
  var svg = d3.select('#right').append('svg')
      .attr('width', width)
      .attr('height', height);

  var path = svg.append("path")
      .attr('d', 'm 12.967,349.469 c 15.107,-87.283 25.932,-180.142 54.214,-264.61 31.17,-93.095 54.138,17.688 65.096,53.934 11.354,37.558 23.177,74.976 34.309,112.6 26.534,89.679 79.275,-25.286 92.183,-45.57 11.749,-18.462 20.938,-43.699 69.798,-48.289 70.298,-6.604 177.054,-4.848 224.858,-5.774')
      .style('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', '3px');

  var circle = svg.append("circle")
      .attr("r", 13)
      .style('fill', 'steelblue')
      .attr('stroke', '#fff')
      .attr('stroke-width', '3px');

  transition();

  function transition() {
    circle.transition()
      .duration(10000)
      .attrTween("transform", translateAlong(path.node()))
      .each("end", transition);
  }

  // Returns an attrTween for translating along the specified path element.
  function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
      return function(t) {
        var p = path.getPointAtLength(t * l);
        return "translate(" + p.x + "," + p.y + ")";
      };
    };
  }

})
