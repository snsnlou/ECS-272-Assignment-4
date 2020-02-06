var data = null

d3.csv("./datasets/tmdb\_5000\_movies.csv").then(grandData => {
    data = grandData
    var timeParse = d3.timeParse('%Y-%m-%d')
    data.forEach(function(d) {
        d['release\_date'] = timeParse(d['release\_date'])
    })
    // console.log(data)
    initStreamGraph()
})

// Config of stream graph

var streamGraphMargin = {top: 10, right: 10, bottom: 40, left: 60}
var streamGraphWidth = 800
var streamGraphHeight = 500
var streamGraphInnerWidth, stremGraphInnerHeight

var streamGraphSVG = null

function initStreamGraph() {
    streamGraphInnerWidth = streamGraphWidth - streamGraphMargin.left - streamGraphMargin.right
    streamGraphInnerHeight = streamGraphHeight - streamGraphMargin.top - streamGraphMargin.bottom

    streamGraphSVG = d3.select('#stream-graph-SVG')
        .attr("width", streamGraphWidth)
        .attr("height", streamGraphHeight)
        .append('g')
        .attr("transform",
            "translate(" + streamGraphMargin.left + ", " + streamGraphMargin.top + ")")

    // Prepare data
    nestedData = d3.nest().key(function(d) {
        var date = new Date(d['release\_date'])
        return date.getFullYear()
    }).key(function(d) {
        var voteAverage = parseInt(d['vote\_average'])
        if(voteAverage == 0) return 0
        else if(voteAverage <= 2) return 2
        else if(voteAverage <= 4) return 4
        else if(voteAverage <= 6) return 6
        else if(voteAverage <= 8) return 8
        else return 10
    }).rollup(function(leaves) {
        return leaves.length
    }).entries(data)
    // console.log(nestedData)
    dataByVote = []
    nestedData.forEach(function(d) {
        var t = new Array(7).fill(0)
        t[0] = d.key
        d.values.forEach(function(dv) {
            t[parseInt(dv.key) / 2 + 1] = dv.value
        })
        var o = {}
        o['release\_date'] = t[0]
        o['unrated'] = t[1]
        o['awful'] = t[2]
        o['bad'] = t[3]
        o['so-so'] = t[4]
        o['good'] = t[5]
        o['excellent'] = t[6]
        dataByVote.push(o) 
    })
    dataByVote.sort(function(a, b) {
        return parseInt(a['release\_date']) > parseInt(b['release\_date']) ? 1 : -1
    })
    console.log(dataByVote)
    // var maxYear = d3.max(dataByVote, function(d) {
    //     return d['release\_date']
    // })
    // var minYear = d3.min(dataByVote, function(d) {
    //     return d['release\_date']
    // })
    // var years = d3.map(dataByVote, function(d) {return d['release\_date']}).keys()
    // for(var i = minYear; i < maxYear; i++) {
    //     if(!years.includes(i)){
    //         var o = {}
    //         o['release\_date'] = 0
    //         o['unrated'] = 0
    //         o['awful'] = 0
    //         o['bad'] = 0
    //         o['so-so'] = 0
    //         o['good'] = 0
    //         o['excellent'] = 0
    //         dataByVote.push(o) 
    //     }
    // }

    var xScaleStreamGraph = d3.scaleTime()
        .range([0, streamGraphInnerWidth])
    var yScaleStreamGraph = d3.scaleLinear()
        .range([streamGraphInnerHeight, 0])
    var zScaleStreamGraph = d3.scaleOrdinal()
        .range(d3.schemeDark2)
    
    var stack = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(['unrated', 'awful', 'bad', 'so-so', 'good', 'excellent'])
    
    var layers = stack(dataByVote)
    console.log(layers)
    xScaleStreamGraph.domain(d3.extent(dataByVote, function(d) {return Date.parse(d['release\_date'])}))
    yScaleStreamGraph.domain([-120, 120])

    var xAxisStreamGraph = d3.axisBottom()
        .scale(xScaleStreamGraph)
    var yAxisStreamGraph = d3.axisLeft()
        .scale(yScaleStreamGraph)
    
    var area = d3.area()
        .x(function(d) {return xScaleStreamGraph(Date.parse(d.data['release\_date']))})
        .y0(function(d) {return yScaleStreamGraph(d[0])})
        .y1(function(d) {return yScaleStreamGraph(d[1])})

    // Define mouse handlers
    var mouseOverHandlerStreamGraph = function(d, i) {
        streamGraphSVG.selectAll('path')
            .transition()
            .duration(500)
            .style('opacity', function(d, j) {
                if(j == i) return 1
                return 0.3
            })
        d3.select(this)
            .style('stroke', 'black')
    }

    var mouseLeaveHandlerStreamGraph = function(d) {
        streamGraphSVG.selectAll('path')
            .style('stroke', 'none')
            .transition()
            .duration(500)
            .style('opacity', 1)
    }
    
    streamGraphSVG.selectAll('path').remove()
    streamGraphSVG.selectAll('path')
        .data(layers)
        .enter()
        .append('path')
            .style('fill', function(d) {return zScaleStreamGraph(d.key)})
            .attr('d', area)
            .on('mouseover', mouseOverHandlerStreamGraph)
            .on('mouseleave', mouseLeaveHandlerStreamGraph)
    
    streamGraphSVG.append('g')
        .call(xAxisStreamGraph)
        .attr('transform', 'translate(0, ' + streamGraphInnerHeight + ')')
    streamGraphSVG.append('g')
        .call(yAxisStreamGraph)
}