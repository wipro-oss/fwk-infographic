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
    d3: 'vendor/d3/d3',
    'd3-tip': 'vendor/d3-tip/index'
  }
});

require(['jquery', 'bootstrap', 'handlebars', 'd3', 'd3-tip'], function($, bootstrap, Handlebars, d3, d3Tip) {
  var nameToId = function(name) {
    return name.replace(/\W+|\s+/g, '-').toLowerCase().replace(/-$/, '');
  };
  function captialize(s) {
    if ( undefined == s ) {
      return s;
    }
    return s.substring(0, 1).toUpperCase() + s.substring(1);
  }
  var filters = {
    'client-web-framework': 'SPA Framework',
    'css-authoring': 'CSS Authoring',
    'js-library': 'JS Library',
    'rwd-css-frameworks': 'RWD Frameworks',
    'server-web-framework': 'Web Framework',
    'web-components': 'Web Components',
    'micro-framework': '&mu; Frameworks'
  };
  var footer = Handlebars.compile($('#footer-tmpl').html());
  $('footer').html(footer({year: new Date().getFullYear() }));
  d3.csv('app/csv/fwk-infographic.csv')
    .get(function(err, rows) {
      if ( err ) throw err;
      var m = {};
      // get unique elements in order
      var order = [
        'tech-trigger',
        'inflated-expectations',
        'disillusionment-trough',
        'enlightenment-slope',
        'productivity-plateau'
      ];
      rows.forEach(function(r) {
        r.id = nameToId(r.name);
        r.excerpt = captialize(r.excerpt);
        r.description = captialize(r.description);
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
      });
      order.forEach(function(grp) {
        m[grp] = m[grp].sort(function(a,b) { return a.score - b.score });
      });
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
      var color = d3.scale.category20().domain(Object.keys(filters));
      var o = d3.scale.ordinal()
          .domain(arr.map(function(fwk) { return fwk.score; }))
          .rangeRoundPoints([0, 50]).range();
      
      var svg = d3.select('#infographic').append('svg')
          .attr('width', width)
          .attr('height', height);

      var path = svg.append("path")
          .attr('d','m 7.177613,550.54409 c 27.69768,-149.13861 47.544599,-307.80481 99.397767,-452.1335 57.14814,-159.06944 99.25843,30.22313 119.3492,92.155891 20.81677,64.174559 42.49347,128.109889 62.90327,192.397229 48.6483,153.23261 145.3455,-43.20565 169.0116,-77.8645 21.541,-31.54563 38.3884,-74.66755 127.97,-82.51039 128.88667,-11.28411 324.61649,-8.28367 412.26209,-9.86591')
          .style('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-width', '1px');

      var colors = ['#00ced1', '#ee82ee', '#00ff7f', '#ffa07a', '#ffd700'];
      colors = [ '#386cb0', '#ffff99', '#fdc086', '#beaed4', '#7fc97f' ];
      colors = [ '#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641' ];
      var splits = [.1, .2, .1, .2, .4];
      function cumulative(i) {
        return splits.slice(0, i).reduce(function(a,b) { return a+b }, 0);
      }
      var pn = path.node();
      var pathWidth = pn.getBBox().width;
      var pathLength = pn.getTotalLength();

      // draw background
      var backgrounds = svg.append('g')
          .attr('id', 'backgrounds');
      var rect = backgrounds.selectAll('rect')
          .data(splits)
          .enter()
          .append('rect')
          .attr('x', function(d, i) { return cumulative(i) * pathWidth })
          .attr('y', 0)
          .attr('width', function(d, i) { return d * pathWidth })
          .attr('height', height)
          .style('fill', function(d, i) { return colors[i]; })
          .style('fill-opacity', '.2');

      // write background labels
      var initialOffset = 5;
      var bgTitles = [
        { label: 'Technology Trigger', orientation: 'vertical', align: 'top' },
        { label: 'Inflated Expectations', orientation: 'horizontal', align: 'middle' },
        { label: 'Disillusionment Trough', orientation: 'vertical', align: 'top' },
        { label: 'Enlightenment Slope', orientation: 'vertical', align: 'top' },
        { label: 'Productivity Plateau', orientation: 'horizontal', align: 'top' }
      ];
      bgTitles.forEach(function(title, i) {
        var vertical = title.orientation == 'vertical';
        var transform = vertical ? 'rotate(-90, 0, 0)' : '';
        var txt = backgrounds.append('text')
            .attr('class', 'bucket')
            .style('stroke-width', '0px')
            .style('fill', i == 2 ? '#ffd700' : colors[i])
            .attr('transform', transform)
            .text(title.label);
        var br = txt.node().getBoundingClientRect();
        var p = {
          x: (cumulative(i) * pathWidth) + initialOffset + (vertical ? Math.ceil(br.width) : 0),
          y: title.align == 'top' ? initialOffset + Math.ceil(br.height)
            : initialOffset  + Math.ceil( (height - br.height) * .7)
        };
        txt.attr('transform', 'translate(' + p.x + ', ' + p.y + ') ' + transform);
      });

      // do some calculation to split the distance by the sections
      var dot = svg.append('circle').attr('fill', '#000').attr('r', '5px').attr('stroke-width', '0px');
      var offs = [];
      var x = 0, i = 0, sl = splits.length;
      while ( i < sl ) {
        var lm = (cumulative(i) + splits[i]) * pathWidth;
        x = lm;
        var xy = pn.getPointAtLength(x);
        dot.attr('transform', 'translate(' + xy.x + ',' + xy.y + ')');
        if ( xy.x < lm ) {
          while ( xy.x < lm ) {
            x += Math.ceil((lm - xy.x) / 2);
            xy = pn.getPointAtLength(x);
            dot.attr('transform', 'translate(' + xy.x + ',' + xy.y + ')');
          } 
        } else {
          while ( xy.x > lm ) {
            x -= Math.ceil((lm - xy.x) / 2);
            xy = pn.getPointAtLength(x);
            dot.attr('transform', 'translate(' + xy.x + ',' + xy.y + ')');
          }         
        }
        offs.push(x + 20);
        i++;
      }
      dot.remove();
      // finished nasty...X|

      var circles = svg.append('g')
          .attr('id', 'phases');

      var tipTemplate = Handlebars.compile($('#tip-tmpl').html());
      var tip = d3Tip()
          .attr('class', 'd3-tip')
          .html(function(d) { return tipTemplate(d); })
          .direction('s')
          .offset([12, 0]);
      svg.call(tip);
      order.forEach(function(group, i) {
        var bucket = circles.append('g')
            .attr('id', group);
        var offset = i == 0 ? 0 : offs[i-1];
        var segment = (offs[i] - offset - 20) / m[group].length;
        //console.log('offset', offset, 'segment', segment, 'length', (pathWidth * splits[i]), 'gl', m[group].length);
        var dot = bucket.selectAll('.fwk')
            .data(m[group])
            .enter()
            .append('g')
            .attr('id', function(d) { return nameToId(d.name) })
            .attr('class', function(d) { return 'fwk ' + d.type.replace(/,/g, ' ') + ' ' + d.language })
            .attr('transform', function(d, i) {
              var dist = offset + (segment * i);
              var p = pn.getPointAtLength(dist);
              var p1 = pn.getPointAtLength(dist - 20);
              var p2 = pn.getPointAtLength(dist + 20);
              var angle = ((Math.atan((p2.y - p1.y)/(p2.x - p1.x)) * 180) / Math.PI) + 90;
              if ( d.id == 'wicket' ) {
                console.log(d.id, angle);
              }
              angle = angle > 114 || ( angle < 90 && (angle+5) > 90) ? angle - 180 : angle;
              return 'translate(' + p.x + ',' + p.y + ') rotate(' + angle.toFixed(2) + ', 0, 0)';
            })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);

        dot.append('circle')
          .attr('r', '4px')
          .attr('fill', function(d, i) { return color(d.type.replace(/,.*$/, '')) });
        dot.append('a')
          .attr('href', function(d, i) { return d.link; })
          .attr('title', function(d, i) { return d.description; })
          .append("text")
          .attr('class', 'fwk-label')
          .attr('transform', 'translate(10, 5)')
          .text(function(d) { return d.name ; });
      });

      // add legend
      var s = 200;

      var filterKeys = Object.keys(filters);
      var svg = d3.select('#infographic svg');
      var legend = svg.append('g')
          .attr('class', 'legend')
          .attr('transform', 'translate('+ (width-s) + ',' + (height-s) + ')');

      //Create the title for the legend
      var text = legend.append("text")
          .attr("class", "title")
          .attr("x", 25)
          .attr("y", 10)
          .style('font-weight', 'bold')
          .style("font-size", "14px")
          .attr("fill", "#404040")
          .text("Legend");

      var g = legend.selectAll('g')
          .data(filterKeys)
          .enter()
          .append('g');

      g.attr('class', 'legend-item')
        .attr('transform', function(d,i) { return 'translate(10, ' + ((i * 10) + 30) + ')' })
        .attr('id', function(d, i) { return 'l-' + d })
        .on('click', function(e) {
          var id = this.id.replace(/l-/, '');
          var checked = this.getAttribute('data-value') == 'checked';
          this.setAttribute('data-value', checked ? 'unchecked' : 'checked');
          var display = checked ? 'none' : 'block';
          svg.selectAll('.' + id).style('visibility', checked ? 'visible' : 'hidden');
          d3.select('#lr-' + id).style('fill-opacity', checked ? 1 : 0);
        });

      g.append('rect')
        .attr('id', function(d, i) { return 'lr-' + filterKeys[i] })
        .attr('x', 0)
        .attr('y', function(d, i) { return i * 10 })
        .attr('width', 10)
        .attr('height', 10)
        .style('stroke', '#404040')
        .style('fill', function(d, i) { return color(d) });

      g.append('text')
        .attr('data-value', 'checked')
        .attr('x', 15)
        .attr('y', function(d, i) { return (i * 10) + 9 })
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .html(function(d,i) { return filters[d] });

      legend.append('text')
        .attr('x', 15)
        .attr('y', (filterKeys.length * 20) + 40)
        .attr('font-size', '12px')
        .attr('fill', '#737373')
        .text('Click to toggle items');


    });
})
