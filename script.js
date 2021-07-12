onload = function () {
    // create a network
    var curr_data;
    var sz;
    var container = document.getElementById('mynetwork');
    var container2 = document.getElementById('mynetwork2');
    var genNew = document.getElementById('generate-graph');
    var solve = document.getElementById('solve');
    var temptext = document.getElementById('temptext');
    // initialise graph options
    var options = {
        edges: {
            //When I select edge the label becomes bold
            labelHighlightBold: true,
            font: {
                size: 20
            }
        },
        nodes: {
            font: '12px red',
            scaling: {
                label: true
            }
        }
    };
    // initialize your network!
    var network = new vis.Network(container);
    network.setOptions(options);
    var network2 = new vis.Network(container2);
    network2.setOptions(options);

    function createData(){
        sz = Math.floor(Math.random() * 8) + 3;
        //10 cities
        const cities = ['Delhi', 'Mumbai', 'Chandigrah', 'Pune', 'Kanpur', 'Jammu', 'Hyderabad', 'Bangalore', 'Kolkata', 'Chennai'];
        let nodes = [];
        for(let i=1;i<=sz;i++){
            nodes.push({id:i, label: cities[i-1]})
        }
        //Convert this to Dataset form for vis
        nodes = new vis.DataSet(nodes);

        let edges = [];
        //We take sz-1 edges
        for(let i=2;i<=sz;i++){
            //To diversify tree
            let neigh = i - Math.floor(Math.random()*Math.min(i-1,3)+1);
            edges.push({type: 0, from: i, to: neigh, color: 'orange',label: String(Math.floor(Math.random()*70)+31)});
        }

        src = 1;//source is 1 or in 0 indexing its 0
        dst = sz; //Destination

        //With this function I add plane nodes as well as if I improve connectivity
        for(let i=1;i<=sz/2;){
            //random nodes
            let n1 = Math.floor(Math.random()*sz)+1;
            let n2 = Math.floor(Math.random()*sz)+1;
            if(n1!=n2){
                if(n1<n2){
                    let tmp = n1;
                    n1 = n2;
                    n2 = tmp;
                }
                let works = 0;
                for(let j=0;j<edges.length;j++){
                    //Check if n1 and n2 are conneced via same edge
                    if(edges[j]['from']===n1 && edges[j]['to']===n2) {
                        //If its already type 1 then we don't need to set it again to 1
                        if(edges[j]['type']===0)
                            works = 1;
                        else
                            works = 2;
                    }
                }

                if(works <= 1) {
                    //If there is no edge then add bus edge. 
                    if (works === 0 && i < sz / 4) {
                        edges.push({
                            type: 0,
                            from: n1,
                            to: n2,
                            color: 'orange',
                            label: String(Math.floor(Math.random() * 70) + 31)
                        });
                    } else {//If bus edge is present then add plane edge too
                        edges.push({
                            type: 1,
                            from: n1,
                            to: n2,
                            color: 'green',
                            label: String(Math.floor(Math.random() * 50) + 1)
                        });
                    }
                    i++;
                }
            }
        }

        let data = {
            nodes: nodes,
            edges: edges
        };
        curr_data = data;
    }

    genNew.onclick = function () {
        createData();
        network.setData(curr_data);
        temptext.style.display = "inline";
        container2.style.display = "none";
    };

    solve.onclick = function () {
        temptext.style.display  = "none";
        container2.style.display = "inline";
        let solveddata=solveData(sz);
        network2.setData(solveddata);
    };

    function dijkstra(graph, sz, src) {
        let vis = Array(sz).fill(0);
        let dist = [];
        for(let i=1;i<=sz;i++)
            dist.push([10000,-1]); //1st is distance and 2nd is parent
        dist[src][0] = 0;

        for(let i=0;i<sz-1;i++){
            let mn = -1;
            //Find minimum distance vertex
            for(let j=0;j<sz;j++){ 
                if(vis[j]===0){
                    if(mn===-1 || dist[j][0]<dist[mn][0])
                        mn = j;
                }
            }

            vis[mn] = 1;
            for(let j in graph[mn]){ //Visit all unvisited nbrs
                let edge = graph[mn][j]; //jth nbr of mn
                if(vis[edge[0]]===0 && dist[edge[0]][0]>dist[mn][0]+edge[1]){
                    dist[edge[0]][0] = dist[mn][0]+edge[1];
                    dist[edge[0]][1] = mn;//Parent of nbr
                }
            }
        }

        return dist;
    }

    function solveData(sz) {
        let data = curr_data;
        let graph = [];
        for(let i=1;i<=sz;i++){
            graph.push([]);
        }
        //Data is a structure holding nodes and edges
        for(let i=0;i<data['edges'].length;i++) {
            let edge = data['edges'][i]; //ith edge
            if(edge['type']===1) //We compute later for this
                continue;
            graph[edge['to']-1].push([edge['from']-1,parseInt(edge['label'])]);
            graph[edge['from']-1].push([edge['to']-1,parseInt(edge['label'])]);
        }

        let dist1 = dijkstra(graph,sz,src-1);//src to all elements
        let dist2 = dijkstra(graph,sz,dst-1);//dest to all elements

        let mn_dist = dist1[dst-1][0];//Minimum distance/time

        let plane = 0;
        let p1=-1, p2=-1;
        for(let pos in data['edges']){
            let edge = data['edges'][pos];
            if(edge['type']===1){
                let to = edge['to']-1;
                let from = edge['from']-1;
                let wght = parseInt(edge['label']);
                //Find distance from src to plane node then add its weight and then plane to dest
                if(dist1[to][0]+wght+dist2[from][0] < mn_dist){
                    plane = wght;
                    p1 = to;
                    p2 = from;
                    mn_dist = dist1[to][0]+wght+dist2[from][0];
                }//Consider opposite scenario too
                if(dist2[to][0]+wght+dist1[from][0] < mn_dist){
                    plane = wght;
                    p2 = to;
                    p1 = from;
                    mn_dist = dist2[to][0]+wght+dist1[from][0];
                }
            }
        }

        new_edges = [];
        if(plane!==0){
            //arrows is vis object that points arrow
            new_edges.push({arrows: { to: { enabled: true}}, from: p1+1, to: p2+1, color: 'green',label: String(plane)});
            new_edges.concat(pushEdges(dist1, p1, false));
            new_edges.concat(pushEdges(dist2, p2, true));
        } else{
            new_edges.concat(pushEdges(dist1, dst-1, false));
        }
        data = {
            nodes: data['nodes'],
            edges: new_edges
        };
        return data;
    }
    //if reverse is true we have to reverse to and from because dist2 moves in opp direction
    function pushEdges(dist, curr, reverse) {
        tmp_edges = [];
        while(dist[curr][0]!=0){
            let fm = dist[curr][1];
            if(reverse)
                new_edges.push({arrows: { to: { enabled: true}},from: curr+1, to: fm+1, color: 'orange', label: String(dist[curr][0] - dist[fm][0])});
            else
                new_edges.push({arrows: { to: { enabled: true}},from: fm+1, to: curr+1, color: 'orange', label: String(dist[curr][0] - dist[fm][0])});
            curr = fm;//make current node equal to parent
        }
        return tmp_edges;
    }

    genNew.click();
};

//Good woooooork