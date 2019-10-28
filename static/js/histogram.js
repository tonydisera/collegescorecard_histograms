function histogram() {
  var margin = { top: 20, right: 20, bottom: 30, left: 40 },
    width = 400,
    height = 400,
    innerWidth = width - margin.left - margin.right,
    innerHeight = height - margin.top - margin.bottom,
    xValue = function(d) {
      return d[0];
    };

  var bins = null;
  var data = null;
  var container = null;

  var highlight = function(names) {

    let selectedData = data.filter(function(d) {
      return names.indexOf(d.name) >= 0;
    })

    container.selectAll("rect").attr("class", "");

    let matchedBins = bins.filter(function(bin) {
      let matchingElements = selectedData.filter(function(d) {
        if (xValue(d) >= bin.x0 && xValue(d) < bin.x1) {
          return true;
        } else {
          return false;
        }
      })
      return matchingElements.length > 0;
    })
    let selectedBins = container.selectAll("rect").filter(function(bin) {
      let matches = matchedBins.filter(function(targetBin) {
        if (bin.x0 == targetBin.x0 && bin.x1 == targetBin.x1) {
          return true;
        } else {
          return false;
        }
      })
      return matches.length > 0;
    })
    selectedBins.attr("class", "highlight")

  }



  function chart(selection) {
    selection.each(function(theData) {

      container = selection;

      data = theData

      let dataValues = data.filter(function(d) {
        return xValue(d);
      })
      .map(function(d) {
        return +xValue(d);
      })

      innerHeight = height - margin.top - margin.bottom;
      innerWidth = width - margin.left - margin.right;

      var x = d3.scaleLinear()
        .domain(d3.extent(dataValues))
        .range([0, innerWidth])

      bins = d3.histogram()
          .domain(x.domain())
          .thresholds(x.ticks(40))(dataValues)

      var y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)]).nice()
        .range([innerHeight, 0])

      // Select the svg element, if it exists.
      let svg = d3
        .select(this)
        .selectAll("svg")
        .data([bins]);

      // Otherwise, create the skeletal chart.
      var svgEnter = svg.enter().append("svg");
      var gEnter = svgEnter.append("g");
      gEnter.append("g").attr("class", "x axis");
      gEnter.append("g").attr("class", "y axis");

      // Update the outer dimensions.
      svg
        .merge(svgEnter)
        .attr("width", width)
        .attr("height", height);

      // Update the inner dimensions.
      var g = svg
        .merge(svgEnter)
        .select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg
        .merge(svgEnter)
        .select(".x.axis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(x));

      svg
        .merge(svgEnter)
        .select(".y.axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

      var bars = g.selectAll(".bar").data(function(d) {
        return d;
      });

      bars.enter()
         .append("rect")
         .attr("x", d => x(d.x0) + 1)
         .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
         .attr("y", d => y(d.length))
         .attr("height", d => y(0) - y(d.length));

      bars.exit().remove();
    });
  }


  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xValue = function(_) {
    if (!arguments.length) return xValue;
    xValue = _;
    return chart;
  };

  chart.highlight = function(_) {
    if (!arguments.length) return highlight;
    highlight = _;
    return chart;
  };

  return chart;
}