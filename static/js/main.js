let fields = []
let selectedFieldMap = {}


let colleges = []
let selectedCollegeMap = {1: {},
                          2: {},
                          3: {},
                          4: {}}

let histChartMap = {1: {}}


$(document).ready(function() {

  init();

});

function init() {
    addRow(1)
}


function showHistogram(rowNumber=1) {
  let fieldNames = getSelectedFieldNames();
  promiseGetData(fieldNames)
  .then(function(data) {

    let chartContainerSelector  = "#chart-row-" + rowNumber + " .charts"
    let chartSelector           = "#chart-row-" + rowNumber + " .charts .hist"
    d3.selectAll(chartSelector).remove()
    histChartMap[rowNumber] = {}

    getSelectedFieldNames().forEach(function(selectedField) {
      let selectedFieldName = selectedField.split(" ").join("_");

      let selection = d3.select(chartContainerSelector).append("div").attr("class", "hist " + selectedFieldName);

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
      histChart.width(180)
               .height(160)
               .margin({top: 20, bottom: 60, left: 35, right: 30})
      histChart.xValue(function(d) {
        return d[selectedField];
      })
      selection.datum(data)
      histChart(selection);

      histChartMap[rowNumber][selectedFieldName] = histChart;
    })
    setTimeout(function() {
      highlightHistograms(rowNumber);
    },3000)

  })
}

function addRow(rowNumber) {
  rowSelector =  "#chart-row-" + rowNumber;
  d3.select(rowSelector).classed("hide", false)

  initDropdowns(rowNumber);

  if (rowNumber == 1) {
    getNumericFields(rowNumber);
  }

  getColleges(rowNumber);
  if (rowNumber != 1) {
    showHistogram(rowNumber)
  }

}

function getSelectedFieldNames() {
  return fields.filter(function(field) {
    return selectedFieldMap[field.name];
  }).
  map(function(field) {
    return field.name;
  })

}

function getSelectedCollegeNames(rowNumber=1) {
  return colleges.filter(function(college) {
    return selectedCollegeMap[rowNumber][college.name];
  })
  .map(function(college) {
    return college.name;
  })

}

function initDropdowns(rowNumber=1) {
  let fieldSelector = "#chart-row-" + rowNumber + ' #scorecard-select';
  if (rowNumber == 1) {
    $(fieldSelector).multiselect(
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
          showHistogram(rowNumber);
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

      });
    }

    let collegeSelector = "#chart-row-" + rowNumber + ' #scorecard-college-select';
    $(collegeSelector).multiselect(
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
            selectedCollegeMap[rowNumber][college] = checked;
          })
        } else {
          let college = options[0].label
          selectedCollegeMap[rowNumber][college] = checked;
        }

      },
      onDropdownHide: function(event) {
        highlightHistograms(rowNumber)
      },
      onSelectAll: function(event) {
        colleges.forEach(function(field) {
          selectedCollegeMap[rowNumber][field.name] = true;
        })

      },
      onDeselectAll: function(event) {
        colleges.forEach(function(field) {
          selectedCollegeMap[rowNumber][field.name] = false;
        })

      }

    });
}


function highlightHistograms(rowNumber=1) {
  for (var key in histChartMap[rowNumber]) {
    let histChart = histChartMap[rowNumber][key];
    histChart.highlight()(getSelectedCollegeNames(rowNumber));
  }
}

function getColleges(rowNumber=1) {
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

    let collegeSelector = "#chart-row-" + rowNumber + " #scorecard-college-select";
    $(collegeSelector).multiselect('dataprovider', optGroups);
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

    let fieldSelector = "#chart-row-1 #scorecard-select";
    $(fieldSelector).multiselect('dataprovider', options);
  })
}

function promiseGetData(fieldNames) {
  return new Promise(function(resolve, reject) {

    if (fieldNames.length == 0) {
      resolve([])
    } else {
      fieldNames.push("name");

      d3.json("getData?fields=" + fieldNames.join(","),
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
