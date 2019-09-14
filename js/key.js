function getW(word1,rela){
    var temp = (((word1[0].charCodeAt()+word1[1].charCodeAt())*52.54652768)-parseInt((word1[0].charCodeAt()+word1[1].charCodeAt())*52.54652768)).toFixed(2);
    var r = Math.floor(temp*1.5 + (rela+5)*0.1)*(0.6+temp*1);//rela+5:10-20 to 0.5-1.5
    return r;
    }
function getL(word1,rela){
    var temp = getW(word1,rela);
    temp = temp*6+Math.random();
    res= temp.toFixed(2).toString();
    return res+"%";
    }
d3.json("../data/data.json",function(error,root){

    var links = [];
    for(var i=0;i<root.length;i++){
        links.push({
            source: root[i].word1,
            target: root[i].word2,
            /*type: "resolved",*/
            rela: root[i].freq//5-15
        })
    }

    var nodes = {};

    links.forEach(function(link) {
        //利用source和target名称进行连线以及节点的确认
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    var width = $("#keyword").width(),
        height = $("#keyword").height();

    var force = d3.layout.force()//layout将json格式转化为力学图可用的格式
        .nodes(d3.values(nodes))//设定节点数组
        .links(links)//设定连线数组
        .size([width, height])//大小
        .linkDistance(520)//连接线长度
        .charge(-1800)//值为+，则相互吸引，绝对值越大吸引力越大。值为-，则相互排斥，绝对值越大排斥力越大
        .on("tick", tick)//指时间间隔，隔一段时间刷新一次画面
        .start();//开始转换

    var zoom = d3.behavior.zoom()//缩放配置，
        .scaleExtent([0.4, 2])//缩放比例
        .on("zoom", zoomed);

    function zoomed(){//缩放函数
        svg.selectAll("g").attr("transform",//svg下的g标签移动大小
            "translate("  +d3.event.translate + ")scale(" +d3.event.scale + ")");
        /*console.log(d3.event.translate+"/"+d3.event.scale);*/
    }

    var svg = d3.select("#keyword").append("svg")//添加svg元素进行图形的绘制
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    //设置连接线
    var edges_line = svg.append("g").selectAll(".edgepath")
            .data(force.links())//连线数据
            .enter()//当数组中的个数大于元素个数时，由d3创建空元素并与数组中超出的部分进行绑定。
            .append("path")//添加path标签
            .attr({
                'd': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},//变量 d 是由D3.js提供的一个在匿名函数中的可用变量。这个变量是对当前要处理的元素的_data_属性的引用。
                'class':'edgepath',//定义该path标签class为edgepath
                'id':function(d,i) {return 'edgepath'+i;}})// i也是d3.js提供的变量，表示当前处理的HTML元素在已选元素选集中的索引值
            .style("stroke","#B43232")//设置线条颜色
            //.style("stroke-width",1.5)//线条粗细
            .style("stroke-width",function(d,i) {return getW(root[i].word1,d.rela)*2})//线条粗细



    //连线上的文字
    var edges_text = svg.append("g").selectAll(".edgelabel")
        .data(force.links())
        .enter()
        .append("text")//添加text标签
        .attr({  'class':'edgelabel',//定义该text标签class为edgelabel
            'id':function(d,i){return 'edgepath'+i;},
            'dx':50,//在连线上的坐标
            'dy':0
        });

    //设置线条上的文字路径
    edges_text.append('textPath')
        .attr('xlink:href',function(d,i) {return '#edgepath'+i})
        .style("pointer-events", "none")
        .text(function(d,i){return getL(root[i].word1,d.rela)});

    function drag(){//拖拽函数
        return force.drag()
            .on("dragstart",function(d){
                d3.event.sourceEvent.stopPropagation(); //取消默认事件
                d.fixed = true;    //拖拽开始后设定被拖拽对象为固定

            });
    }

    //圆圈的提示文字 根据需要到数据库中进行读取数据
    var tooltip = d3.select("body")
        .append("div")//添加div并设置成透明
        .attr("class","tooltip")
        .style("opacity",0.0);


    //圆圈
    var circle = svg.append("g")
        .selectAll("circle")
        .data(force.nodes())//表示使用force.nodes数据
        .enter().append("circle")
        .style("fill","#00BFFF")
        .style('stroke',"#4682B4")
        .style('cursor',"pointer")
        .attr("r",function(node,i){
            var r;
            r = set_r(node.name);
            return r*1.6;
        })//设置圆圈半径
        .on("click",function(node){
            //单击时让连接线加粗
            /*edges_line.style("stroke-width",function(line){
                if(line.source.name==node.name || line.target.name==node.name){//当与连接点连接时变粗
                    return 2;
                }else{
                    return 0.5;
                }
            });*/
            circle.style('stroke-width',2)
                  .style('fill',"#00BFFF")
                  .style('stroke',"#4682B4");//所有的圆圈边框
            d3.select(this).style('stroke-width',14)
                           .style('fill',"#4682B4")
                           .style('stroke',"#4682B4");//被选中的圆圈边框
        })
        .on("dblclick",function(d){
            //双击节点时节点恢复拖拽
            d.fixed = false;
        })
        .on("mouseover",function(d){
            set_tooltip(d.name);
        })
        .on("mousemove",function(d){
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY + 20) + "px");
        })
        .on("mouseout",function(d){
            tooltip.style("opacity",0.0);
        })
        .call(drag());//使顶点可以被拖动


    svg.selectAll("g").call(drag());//为svg下的所有g标签添加拖拽事件
    svg.on("dblclick.zoom", null);//取消svg和圆圈的双击放大事件（d3中默认开启7个事件，关闭防止与上面的双击事件冲突）
    circle.on("dblclick.zoom", null);


    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        //返回缺失元素的占位对象（placeholder），指向绑定的数据中比选定元素集多出的一部分元素。
        .enter()
        .append("text")//添加text标签
        .attr("dy", ".35em") //将文字下移
        .attr("text-anchor", "middle")//在圆圈中加上数据
        .style('fill',"#555")
        .style('cursor',"pointer")
        .on("mouseover",function(d){
            set_tooltip(d.name);
        })
        .on("mouseout",function(d){
            tooltip.style("opacity",0.0);
        })
        .call(drag())
        .attr('x',function(d){
            // console.log(d.name+"---"+ d.name.length);
            var re_en = /[a-zA-Z]+/g;
            //如果是全英文，不换行
            if(d.name.match(re_en)){
                d3.select(this).append('tspan')//添加tspan用来方便时使用绝对或相对坐标来调整文本
                    .attr('x',0)
                    .attr('y',2)
                    .text(function(){return d.name+"机场";});
            }
            //如果小于8个字符，不换行
            else if(d.name.length+2<=8){
                d3.select(this).append('tspan')
                    .attr('x',0)
                    .attr('y',2)
                    .text(function(){return d.name+"机场";});
            }else if(d.name.length+2>=16){//大于16个字符时，将14个字后的内容显示为。。。
                var top=d.name.substring(0,8);
                var bot=d.name.substring(8,14)+"...";

                d3.select(this).text(function(){return '';});

                d3.select(this).append('tspan')//前n个字
                    .attr('x',0)
                    .attr('y',-7)
                    .text(function(){return top;});

                d3.select(this).append('tspan')//后n个字
                    .attr('x',0)
                    .attr('y',10)
                    .text(function(){return bot;});

            }
            else {//8-16字符分两行显示
                var top=d.name.substring(0,8);
                var bot=d.name.substring(8,d.name.length);

                d3.select(this).text(function(){return '';});

                d3.select(this).append('tspan')
                    .attr('x',0)
                    .attr('y',-7)
                    .text(function(){return top;});

                d3.select(this).append('tspan')
                    .attr('x',0)
                    .attr('y',10)
                    .text(function(){return bot;});
            }

        });


    function tick() {//刷新页面函数
        circle.attr("transform", transform1);//圆圈
        text.attr("transform", transform1);//顶点文字
        edges_line.attr('d', function(d) { //连接线
            var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
            return path;
        });

        edges_text.attr('transform',function(d,i){//连线上的文字
            if (d.target.x<d.source.x){//判断起点和终点的位置，来让文字一直显示在线的上方且一直是正对用户
                bbox = this.getBBox();//获取矩形空间,并且调整翻转中心。
                rx = bbox.x+bbox.width/2;
                ry = bbox.y+bbox.height/2;
                return 'rotate(180 '+rx+' '+ry+')';
            }
            else {
                return 'rotate(0)';
            }
        })
            .attr('dx',function(d,i){

                return Math.sqrt(Math.pow(d.target.x-d.source.x,2)+Math.pow(d.target.y-d.source.y,2))/2-20;
                //设置文字一直显示在线的中间

            });
    }


    //设置圆圈和文字的坐标
    function transform1(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }

    function set_r(name){ //设置圆圈大小
        var r;
        for(var i=0;i<links.length;i++){
            if(name == links[i].source.name || name == links[i].target.name){
                r=parseInt(links[i].rela) * 3;
                break;
            }
        }
        return r;
    }

    function set_tooltip(name){//设置提示内容
        var r;
        for(var i=0;i<links.length;i++){
            if(name == links[i].source.name || name == links[i].target.name){
                r=links[i].rela;
                break;
            }
        }
        var temp = (((name[0].charCodeAt()+name[1].charCodeAt())*52.54652768)-parseInt((name[0].charCodeAt()+name[1].charCodeAt())*52.54652768)).toFixed(2);
        tooltip.html("Airport " + name + "【Value：" + parseInt(10+(r-5)*3.5+temp*2)+"."+temp.toString().split(".")[1] + "%】")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY + 20) + "px")
            .style("opacity",1.0);
    }

    zoom.translate([242,180]);
    zoom.scale(zoom.scale() * 0.4);
    svg.selectAll("g").attr("transform",//svg下的g标签移动大小
        "translate(242,180)scale(0.4)");
    //如果不想显示连线上文字，可在js中添加：
    //edges_text.style("opacity",0);

})



