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
      var width = 1000, height = 600;
      var color = d3.scale.category20();
      var o = d3.scale.ordinal()
          .domain(arr.map(function(fwk) { return fwk.score; }))
          .rangeRoundPoints([0, 50]).range();
      
      var svg = d3.select('#right').append('svg')
          .attr('width', width)
          .attr('height', height);

      var path = svg.append("path")
          .attr('d','m 7.177613,550.54409 c 27.69768,-149.13861 47.544599,-307.80481 99.397767,-452.1335 57.14814,-159.06944 99.25843,30.22313 119.3492,92.155891 20.81677,64.174559 42.49347,128.109889 62.90327,192.397229 48.6483,153.23261 145.3455,-43.20565 169.0116,-77.8645 21.541,-31.54563 38.3884,-74.66755 127.97,-82.51039 128.88667,-11.28411 324.61649,-8.28367 412.26209,-9.86591')
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
          .attr('stroke-width', '0px');

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
