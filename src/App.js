import React, { useState, useRef } from "react";
import _, { map } from 'underscore';
import * as d3 from 'd3';
import './App.css';
import FileList from './FileList';
import { useDetectOutsideClick } from "./useDetectOutsideClick";
import JSZip from 'jszip';
import saveAs from 'file-saver';
import Papa from 'papaparse'

function App() {

  const [fileList, setFileList] = useState();

  const dropdownRef = useRef(null);
  const [isActive, setIsActive] = useDetectOutsideClick(dropdownRef, false);

  const hiddenFileInputRef = useRef(null);

  const listRef = useRef(null);

  const handleClickDropdwon = () => {
    setIsActive(!isActive);
  };

  const handleClickFileBtn = () => {
    hiddenFileInputRef.current.click();
  };

  const handleChangeFileInput = (event) => {

    console.log(`files:${event.target.files.length}`);

    let filterFiles = [];

    for (let i = 0; i < event.target.files.length; i++) {
      if(/\.(dat2)$/i.test(event.target.files[i].name)) {
          filterFiles.push(event.target.files[i])
      };
    };
    // for (let i = 0; i < event.target.files.length; i++) {
    //   filterFiles.push(event.target.files[i]);
    // };
    setFileList(filterFiles);
  };

  const handleClickFileSave = () => {
    var now = new Date();
    var res = "" + now.getFullYear() + padZero(now.getMonth() + 1) +
        padZero(now.getDate()) + padZero(now.getHours()) + 
        padZero(now.getMinutes()) + padZero(now.getSeconds());

    createZip().then(resultZip => {
      resultZip.generateAsync({type:"blob"}).then(content => {
          // see FileSaver.js
          saveAs(content, res + '.zip');
      });
    });
  };

  function createZip () {
    return new Promise((resolve, reject) => {

      let zip = new JSZip();

      for (let i = 0; i < fileList.length; i++) {

        let file = fileList[i];
        let fileName = file.name;
        let _fileLen = fileName.length;
        let _lastDot = fileName.lastIndexOf('.');
        let _fileExt = fileName.substring(_lastDot, _fileLen);
        let _fileNameExt = fileName.substring(0, _lastDot);

        let index = i;

        // console.log(i);

        fileRead(file).then(result => {
          var csv = Papa.unparse(result);
          var blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
          zip.file(_fileNameExt + '.csv', blob);
          // console.log(_fileNameExt + '.csv');

          if(index == fileList.length - 1) {
              resolve(zip);
          };
        });
      };
    });
  };

  function padZero(num) {
    return (num < 10 ? "0" : "") + num;
  }

  function handleChangeList (file) {
    console.log(file);
    fileRead(file).then(result => {
      const chartData = [];
      for (let index = 0; index < result.length; index++) {
          const buffer = result[index];
          for (let j = 0; j < result[index].length; j++) {
              chartData.push([j, index, buffer[j]]);
          };
      };
      drawChart(chartData);
    });
  }

  function fileRead (file) {
    return new Promise((resolve, reject) => {
      // console.log(`file=${file}`);
      if (!file) { return }; // file이 없을 경우 return
      const fileSlice = file.slice(8); // 파일의 Header 8Byte 이후
      const reader = new FileReader(); // FileReader 객체 생성

      reader.readAsArrayBuffer(fileSlice); // 파일 Read

      reader.onload = () => {  // 파일을 다읽게 되면 콜백

        const buffer = reader.result;
        const view = new DataView(buffer);

        const prpdRowData = [];
        const prpdData = [];

        for (let index = 0; index < 65536; index++) {
            const data = view.getUint16((index * 2), false);
            prpdRowData.push(data);
        };

        while (prpdRowData.length) prpdData.push(prpdRowData.splice(0, 256));

        const prpd = _.unzip(prpdData);
        resolve(prpd);
      };
    });
  };

  function drawChart (inputData) {

    const w = document.getElementById('prpdDiv').clientWidth - 10;
    const h = document.getElementById('prpdDiv').clientHeight - 10;
    const padding = 30;

    const rectW = w / 256;
    const rectH = h / 256;

    const svg = d3.select("#prpdChart")
    .attr('width', w)
    .attr('height', h);

    svg.selectAll("rect")
    .remove();

    svg.selectAll("g")
    .remove();

    const xScale = d3.scaleLinear()
    .domain([0, 255])
    .range([padding, w - padding * 2]);

    const yScale = d3.scaleLinear()
    .domain([0, 255])
    .range([h - padding, padding]);

    const zScale = d3.scaleLinear()
    .domain([0, 0.8, 1.6, 8, 54.4, 80])
    .range(['#fafafa', '#2f2f2f', '#999999', '#ff5f59', '#ff0000', '#ffd659']);

    // X축 생성
    const xAxis = d3.axisBottom()
    .scale(xScale);

    svg.append("g")
    .attr("transform", `translate(0,${h - padding})`)
    .call(xAxis)
    .exit().remove();

    // Y축 생성
    const yAxis = d3.axisLeft()
    .scale(yScale);

    svg.append("g")
    .attr("transform", `translate(${padding},0)`)
    .call(yAxis)
    .exit().remove();

    svg.selectAll('rect')
    .data(inputData)
    .enter()
    .filter(d => d[2] !== 0)
    .append("rect")
    .attr("x", d => xScale(d[0]))
    .attr("y", d => yScale(d[1]))
    .attr("width", rectW)
    .attr("height", rectH)
    .style("fill", d => zScale(d[2]))
    .exit().remove();
  }

  return (
    <div className="wrapper">
      <nav id="sidebar" className="sidebar">
        <div className="sidebar-content js-simplebar">
          <a className="sidebar-brand" href="PRPD_Viewer.html">
            <span className="align-middle">SMND</span>
          </a>
          <ul className="sidebar-nav">
            <li className="sidebar-header">
              Pages
            </li>
            <li className="sidebar-item active">
              <a className="sidebar-link" href="PRPD_Viewer.html">
                <i className="align-middle" data-feather="sliders"></i> <span className="align-middle">Viewer</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <div className="main">
        <nav className="navbar navbar-expand navbar-light navbar-bg">
          <div className="mainTitle">
            <h1>PRPD Viewer</h1>
          </div>
          <div className="navbar-collapse collapse">
            <ul className="navbar-nav navbar-align">
              <li className="nav-item dropdown">
                <button ref={ dropdownRef } type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" onClick={ handleClickDropdwon }>File</button>
                <div className={`dropdown-menu dropdown-menu-right ${isActive ? "show" : ""}`}>
                  <div className="dropdown-item">
                    <button className="btn" onClick={ handleClickFileBtn }>Upload folder</button>
                    <input type="file" id="directory_upload" ref={ hiddenFileInputRef } onChange={ handleChangeFileInput } webkitdirectory="" multiple="" />
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item"><button className="btn" id="fileSave" onClick={ handleClickFileSave }>Save all file</button></div>
                </div>
              </li>
            </ul>
          </div>
        </nav>
        <main className="content">
          <div className="container">
            <div className="row">
              <div className="col-1">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">List</h3>
                  </div>
                  <div className="card-body-list">
                    <ul ref={ listRef } className="list-group">
                      {/* <select multiple="multiple" className="form-control" ref={ listRef } onChange={ handleChangeList }></select> */}
                      <FileList files={fileList} handleChangeList={handleChangeList}></FileList>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-2">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Graph</h3>
                  </div>
                  <div className="card-body-graph" id="prpdDiv">
                    <svg id="prpdChart"></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
