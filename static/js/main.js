let fields = []
let selectedFieldMap = {}

let colleges = []
let selectedCollegeMap = {}

let histChartMap = {}


$(document).ready(function() {

  init();

});

function init() {
    initDropdowns();
    getNumericFields();
    getColleges();
}


function showHistogram() {
  promiseGetData()
  .then(function(data) {

    d3.selectAll(".charts .hist").remove()
    histChartMap = {}

    getSelectedFieldNames().forEach(function(selectedField) {
      let selectedFieldName = selectedField.split(" ").join("_");

      let selection = d3.select(".charts").append("div").attr("class", "hist " + selectedFieldName);

      selection.append("span").attr("class", "chart-title").text(selectedField)

      let nonNullValues = data.filter(function(d) {
        return d[selectedField];
      })
      let nullRatio = ((data.length - nonNullValues.length) / data.length);
      let nullPct = nullRatio * 100;
      let nullPctLabel  = +(Math.round(nullPct + "e+" + 0)  + "e-" + 0);
      selection.append("span")
               .attr("class", function() {
                  if (nullRatio > .25) {
                    return "chart-label danger"
                  } else {
                    return "chart-label"
                  }
               })
               .text(nullPctLabel + "% blank")

      let histChart = histogram();
      histChart.width(230)
               .height(200)
               .margin({top: 20, bottom: 60, left: 40, right: 30})
      histChart.xValue(function(d) {
        return d[selectedField];
      })
      selection.datum(data)
      histChart(selection);

      histChartMap[selectedFieldName] = histChart;
    })
    setTimeout(function() {
      highlightHistograms();
    },3000)

  })
}

function getSelectedFieldNames() {
  return fields.filter(function(field) {
    return selectedFieldMap[field.name];
  }).
  map(function(field) {
    return field.name;
  })

}

function getSelectedCollegeNames() {
  return colleges.filter(function(college) {
    return selectedCollegeMap[college.name];
  })
  .map(function(college) {
    return college.name;
  })

}

function initDropdowns() {
  $('#scorecard-select').multiselect(
    { enableFiltering: true,
      includeSelectAllOption: true,
      enableCaseInsensitiveFiltering: true,
      nonSelectedText: "Select fields",
      onChange: function(options, checked) {

        if (options && options.length > 0) {
          if (Array.isArray(options)) {
            options.forEach(function(option) {
              let field = option[0].label
              selectedFieldMap[field] = checked;
            })
          } else {
            let field = options[0].label
            selectedFieldMap[field] = checked;
          }
        }
      },
      onDropdownHide: function(event) {
        showHistogram();
      },
      onSelectAll: function(event) {
        fields.forEach(function(field) {
          selectedFieldMap[field.name] = true;
        })

      },
      onDeselectAll: function(event) {
        fields.forEach(function(field) {
          selectedFieldMap[field.name] = false;
        })

      }

    } );
    $('#scorecard-college-select').multiselect(
    { enableFiltering: true,
      includeSelectAllOption: true,
      nonSelectedText: "Select college to highlight",
      enableCaseInsensitiveFiltering: true,
      enableClickableOptGroups: true,
      collapseOptGroupsByDefault: true,
      onChange: function(options, checked) {
        if (Array.isArray(options)) {
          options.forEach(function(option) {
            let college = option[0].label
            selectedCollegeMap[college] = checked;
          })
        } else {
          let college = options[0].label
          selectedCollegeMap[college] = checked;
        }

      },
      onDropdownHide: function(event) {
        highlightHistograms()
      },
      onSelectAll: function(event) {
        colleges.forEach(function(field) {
          selectedCollegeMap[field.name] = true;
        })

      },
      onDeselectAll: function(event) {
        colleges.forEach(function(field) {
          selectedCollegeMap[field.name] = false;
        })

      }

    } );
}


function highlightHistograms() {
  for (var key in histChartMap) {
    let histChart = histChartMap[key];
    histChart.highlight()(getSelectedCollegeNames());
  }
}

function getColleges() {
  promiseGetData(["usnews_2019_rank", "control"])
  .then(function(data) {
    colleges = data;


    let optGroups = [];

    let options = colleges.filter(function(college) {
      return college["usnews_2019_rank"] != null
    })
    .sort(function(a,b) {
      return a["usnews_2019_rank"] - b["usnews_2019_rank"];
    })
    .map(function(college) {
      return { label: college.name, title: college.name, value: college.name };
    })
    optGroups.push( {label: 'US News top 200', children: options })

    let publicColleges = colleges.filter(function(college) {
      return college["control"] == 1
    })
    .sort(function(a,b) {
      return  a.name.localeCompare(b.name);
    })
    .map(function(college) {
      return { label: college.name, title: college.name, value: college.name };
    })
    optGroups.push( {label: 'Public colleges', children: publicColleges })


    optGroups.push( {label: 'Private colleges', children:
      colleges.filter(function(college) {
        return college["control"] == 2
      })
      .sort(function(a,b) {
        return  a.name.localeCompare(b.name);
      })
      .map(function(college) {
        return { label: college.name, title: college.name, value: college.name };
      })
    })

    optGroups.push( {label: 'Private for-profit', children:
      colleges.filter(function(college) {
        return college["control"] == 3
      })
      .sort(function(a,b) {
        return  a.name.localeCompare(b.name);
      })
      .map(function(college) {
        return { label: college.name, title: college.name, value: college.name };
      })
    })


    $('#scorecard-college-select').multiselect('dataprovider', optGroups);
  })
}

function getNumericFields() {
  d3.json("getFields",
  function (err, data) {
    if (err) {
      console.log(err)
    }
    fields = data.filter(function(field) {
      return field.type == 'numeric'
    });

    let options = []
    fields.forEach(function(field) {
      options.push({ label: field.name, title: field.name, value: field.name } );
    })
    $('#scorecard-select').multiselect('dataprovider', options);
  })
}

function promiseGetData(fieldNames) {
  return new Promise(function(resolve, reject) {
    let theFieldNames = fieldNames ? fieldNames : getSelectedFieldNames();

    if (theFieldNames.length == 0) {
      resolve([])
    } else {
      theFieldNames.push("name");

      d3.json("getData?fields=" + theFieldNames.join(","),
      function (err, data) {
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve(data)
      })
    }
  })

}
