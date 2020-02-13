// Config of stream graph

var barChartMargin = { top: 10, right: 10, bottom: 40, left: 60 }
var barChartWidth = 400
var barChartHeight = 250
var barPadding = 5
var barChartInnerWidth, barChartInnerHeight, barWidth

var barChartSVG = null

var possibleKeysBarChart = ['topics', 'nouns', 'dates', 'people', 'verbs', 'acronyms']

var selectedBar = -1

function initBarChart() {
    barChartInnerWidth = barChartWidth - barChartMargin.left - barChartMargin.right
    barChartInnerHeight = barChartHeight - barChartMargin.top - barChartMargin.bottom
    barWidth = (barChartInnerWidth / possibleKeysBarChart.length)

    barChartSVG = d3.select('#bar-chart-SVG')
        .attr("width", barChartWidth)
        .attr("height", barChartHeight)
        .append('g')
        .attr("transform",
            "translate(" + barChartMargin.left + ", " + barChartMargin.top + ")")
}

function onChangeBarChart(text) {

    barChartSVG.selectAll('*')
        .remove()

    var NLP = nlp(text)
    topics = NLP.topics().out("frequency");
    nouns = NLP.nouns().out("frequency");
    dates = NLP.dates().out("frequency");
    people = NLP.people().out("frequency");
    verbs = NLP.verbs().out("frequency");
    acronyms = NLP.acronyms().out("frequency");

    var barChartData = [
        d3.sum(topics, function(d) {return d.count}),
        d3.sum(nouns, function(d) {return d.count}),
        d3.sum(dates, function(d) {return d.count}),
        d3.sum(people, function(d) {return d.count}),
        d3.sum(verbs, function(d) {return d.count}),
        d3.sum(acronyms, function(d) {return d.count})
    ]
    var terms = [topics, nouns, dates, people, verbs, acronyms]
    console.log(barChartData)
    var yScaleBarChart = d3.scaleLinear()
        .domain([0, d3.max(barChartData)])
        .range([0, barChartInnerHeight])
    
    var xScaleBarChart = d3.scalePoint()
        .domain(possibleKeysBarChart)
        .range([barWidth / 2, barChartInnerWidth - barWidth / 2 - barPadding])
    
    var xAxisBarChart = d3.axisBottom()
        .scale(xScaleBarChart)
    
    var yAxisBarChart = d3.axisLeft()
        .scale(d3.scaleLinear().domain([0, d3.max(barChartData)]).range([barChartInnerHeight, 0]))
    
    var mouseOverHandlerBarChart = function(d, i) {
        if(selectedBar != -1) return
        d3.select(this)
            .style('opacity', '0.7')
    }

    var mouseClickHandlerBarChart = function(d, i) {
        wordCloudSVG.selectAll("*").remove();
        if(selectedBar != i) {
            selectedBar = i
            barChartSVG.selectAll("rect")
                .style('stroke', 'none')
                .style('opacity', '1')
            d3.select(this)
                .style('stroke', 'yellow')
                .style('opacity', '0.7')

            layout = d3.layout.cloud()
                .size([700, 400])
                .words(terms[i].map(function (d) { return { text: d.normal, size: +d.count * 20 }; }))
                .padding(2)
                .font("Impact")
                .fontSize(function (d) { return d.size; })
                .on("end", function (d) { draw(d, i) })
                .start();
        } else {
            selectedBar = -1
            d3.select(this)
                .style('stroke', 'none')
        }
    }

    var mouseLeaveHandlerBarChart = function(d, i) {
        if(selectedBar != -1) return
        barChartSVG.selectAll("rect")
            .style('opacity', '1')
    }

    barChartSVG.selectAll("rect")
        .data(barChartData)
        .enter()
        .append("rect")
        .attr("y", function(d) {
            return barChartInnerHeight - yScaleBarChart(d)
        })
        .attr("height", function(d) {
            return yScaleBarChart(d)
        })
        .attr("width", barWidth - barPadding)
        .attr("fill", "#0080FF")
        .attr("x", function(d, i) {
            return barWidth * i
        })
        .on("mouseover", mouseOverHandlerBarChart)
        .on("mouseleave", mouseLeaveHandlerBarChart)
        .on("click", mouseClickHandlerBarChart)

    barChartSVG.append('g')
        .attr('transform', 'translate(0, ' + barChartInnerHeight + ')')
        .call(xAxisBarChart)
    
    barChartSVG.append('g')
        .call(yAxisBarChart)
}