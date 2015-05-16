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
      var pps = 0, ppn = 0;
      rows.forEach(function(row) {
        var a = m[row.bucket] || [];
        // my formula (stars/2) + forks + (commits / releases) + (contributors * 10) - openIssues + (tag-toal * 0.8)
        if ( row.releases != '' ) {
          row.githubScore = Math.ceil(
            (parseInt(row.stars)/2)
              + parseInt(row.forks)
              + (parseInt(row.releases) == 0 ? parseInt(row.commits) : parseInt(row.commits) / parseInt(row.releases) )
              + (parseInt(row.contributors == '' ? '0': row.contributors) * 10)
              - parseInt(row.openIssues));
          if ( row.bucket == 'productivity-plateau' ) {
            pps += row.githubScore;
            ppn++;
          }
        }
        if ( row.stackoverflowQuestions != '' ) {
          row.stackoverflowScore = Math.ceil(parseInt(row.stackoverflowQuestions) * 0.8);
        } else {
          row.stackoverflowScore = 0;
        }
        a.push(row);
        m[row.bucket] = a;
      });
      var fwks = [];
      // ext-js
      order.forEach(function(grp) {
        m[grp].forEach(function(fwk) {
          if ( fwk.githubScore == undefined ) {
            fwk.githubScore = Math.ceil(pps/ppn);
          }
          fwk.score = fwk.githubScore + fwk.stackoverflowScore;
        });
        fwks = fwks.concat(m[grp]);
      })
      var arr = [];
      var render = function() {
        var page = $('#page');
        page.empty();
        var template = Handlebars.compile($('#grp-tmpl').html());
        order.forEach(function(grp) {
          arr = arr.concat(m[grp]);
          page.append(template({ groupName: grp.replace(/-/g, ' '), frameworks: m[grp] }));
        });
      };
      render();

      
      // http://bl.ocks.org/mbostock/1705868
      var width = 700, height = 400;
      var color = d3.scale.category20();
      var o = d3.scale.ordinal()
          .domain(arr.map(function(fwk) { return fwk.score; }))
          .rangeRoundPoints([0, 50]).range();
      
      var svg = d3.select('#right').append('svg')
          .attr('width', width)
          .attr('height', height);

      var path = svg.append("path")
          .attr('d', 'm 12.967,349.469 c 15.107,-87.283 25.932,-180.142 54.214,-264.61 31.17,-93.095 54.138,17.688 65.096,53.934 11.354,37.558 23.177,74.976 34.309,112.6 26.534,89.679 79.275,-25.286 92.183,-45.57 11.749,-18.462 20.938,-43.699 69.798,-48.289 70.298,-6.604 177.054,-4.848 224.858,-5.774')
          .style('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-width', '3px');

      var l = path.node().getTotalLength() / fwks.length;
      var circle = svg.selectAll('circle')
          .data(fwks)
          .enter()
          .append("circle")
          .attr("r", '5px')//function(d,i) { return o[i] })
          .style('fill', function(d,i) { return color(i); })
          .attr('stroke', '#fff')
          .attr('transform', function(d, i) { var p = path.node().getPointAtLength(i * l); console.log(p.x, p.y); return 'translate(' + p.x + ',' + p.y + ')' ;})
          .attr('stroke-width', '3px');

        var text = svg.selectAll("text")
            .data(fwks)
            .enter().append("text")
            .attr("class", "label")
            .attr('transform', function(d, i) { var p = path.node().getPointAtLength(i * l); console.log(p.x, p.y); return 'translate(' + Math.ceil(p.x + 5) + ',' + (p.y + (i%2 == 0 ? -5 : 12)) + ')' ;})
            .text(function(d) { return d.name ; });

    });



/*
  transition();

  function transition() {
    circle.transition()
      .duration(10000)
      .attrTween("transform", translateAlong(path.node()))
      .each("end", transition);
  }
*/
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
