import React from "react";
import ReactDOM from "react-dom";
import {
  Button,
  Table,
  Input,
  message,
  Modal,
  Upload,
  Select,
  Progress,
} from "antd";
import {
  DiffOutlined,
  PlusOutlined,
  FullscreenExitOutlined,
  SortDescendingOutlined,
  GithubOutlined,
} from "@ant-design/icons";
import lpFileNameSort from "lp-file-name-sort/dist/index.esm.js";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import "./merge.css";

const SUPORT_INPUT_EXT = ["ts", "mp4", "mov", "avi", "mkv"];

export default class Merge extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDropMask: false,
      fileList: [],
      cliContent: "控制台信息：",
      showMergeModal: false,
      outputName: "output",
      outputExt: ".mkv",
      isMerging: false,
      progressValue: 0,
    };
  }

  handleAddBtnClick(_, files) {
    this.setState({
      fileList: files.map((item, key) => ({
        name: item.name,
        num: key + 1,
        raw: item,
        ext: item.name.substr(item.name.lastIndexOf(".") + 1),
        id: key,
      })),
    });
  }

  async handleMegeBtnClick() {
    const { fileList, outputExt, outputName } = this.state;

    this.setState({ cliContent: "控制台信息：", isMerging: true });

    if (!this.ffmpeg.isLoaded()) {
      await this.ffmpeg.load();
    }

    for (let file of fileList) {
      await this.ffmpeg.FS(
        "writeFile",
        // 不支持中文字符
        file.id + "." + file.ext,
        await fetchFile(file.raw)
      );
    }

    await this.ffmpeg.run(
      "-i",
      `concat:${fileList.map((file) => file.id + "." + file.ext).join("|")}`,
      outputName + outputExt
    );

    // 此方法无法计算 duration
    // this.ffmpeg.FS(
    //   "writeFile",
    //   "concat_list.txt",
    //   fileList.map((file) => `file ${file.id + file.ext}`).join("\n")
    // );
    // await this.ffmpeg.run(
    //   "-f",
    //   "concat",
    //   "-safe",
    //   "0",
    //   "-i",
    //   "concat_list.txt",
    //   "output.mp4"
    // );

    const output = await this.ffmpeg.FS("readFile", outputName + outputExt);

    const link = document.createElement("a");
    link.download = outputName + outputExt;
    link.href = URL.createObjectURL(new Blob([output]));
    link.click();
    link.remove();

    this.setState({
      isMerging: false,
      showMergeModal: false,
      progressValue: 0,
    });

    message.success("合并完成");
  }

  handleFileSort() {
    this.setState({
      fileList: this.state.fileList
        .sort((a, b) => lpFileNameSort(a.name, b.name))
        .map((item, key) => ({
          ...item,
          num: key + 1,
        })),
    });
  }

  handleDropLeave(e) {
    e.preventDefault();
    e.stopPropagation();

    !this.state.showDropMask ||
      this.setState({
        showDropMask: false,
      });
  }

  handleBtnGithub() {
    window.open("https://github.com/lecepin");
  }

  componentDidMount() {
    this.ffmpeg = createFFmpeg({
      log: true,
      logger: ({ type, message }) => {
        type == "fferr" &&
          this.setState(
            {
              cliContent: this.state.cliContent + message + "\n",
            },
            () => {
              if (this.refConsole) {
                this.refConsole.scrollTop = this.refConsole.scrollHeight;
              }
            }
          );
      },
      progress: ({ ratio }) => {
        this.setState({
          progressValue: ~~(ratio * 100),
        });
      },
      corePath:
        "https://unpkg.zhimg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    });

    window.addEventListener(
      "dragenter",
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.state.showDropMask ||
          this.setState({
            showDropMask: true,
          });
      },
      false
    );
    window.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
    window.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.setState({
        showDropMask: false,
      });

      const dropfiles = [];

      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        let item = e.dataTransfer.items[i];
        if (item.kind === "file") {
          let filename = item.getAsFile().name;
          let ext = filename.substr(filename.lastIndexOf(".") + 1);
          SUPORT_INPUT_EXT.includes(ext) && dropfiles.push(item.getAsFile());
        }
      }
      dropfiles.length &&
        this.setState({
          fileList: dropfiles.map((item, key) => ({
            name: item.name,
            raw: item,
            num: key + 1,
            ext: item.name.substr(item.name.lastIndexOf(".") + 1),
            id: key,
          })),
        });
    });
  }

  render() {
    const {
      showDropMask,
      fileList,
      cliContent,
      showMergeModal,
      outputExt,
      outputName,
      isMerging,
      progressValue,
    } = this.state;
    return (
      <div className="Merge">
        {showDropMask && (
          <div
            className="Merge-drop"
            onDragLeave={(e) => this.handleDropLeave(e)}
          >
            <DiffOutlined style={{ fontSize: 150 }} />
            <div>添加文件</div>
          </div>
        )}
        <div className="Merge-btns">
          <Upload
            accept={SUPORT_INPUT_EXT.map((i) => "," + i).join(",")}
            multiple={true}
            beforeUpload={(file, fileList) => {
              this.handleAddBtnClick(file, fileList);
              return false;
            }}
            fileList={[]}
            className="Merge-btns-upload"
          >
            <Button type="primary" ghost icon={<PlusOutlined />}>
              添加文件
            </Button>
          </Upload>
          <Button
            type="primary"
            ghost
            icon={<SortDescendingOutlined />}
            onClick={() => this.handleFileSort()}
          >
            排序
          </Button>
          <Button
            type="primary"
            ghost
            icon={<FullscreenExitOutlined />}
            onClick={() => {
              if (!this.state.fileList.length) {
                message.warning("还没有添加文件~", 1);
                return;
              }
              this.setState({ showMergeModal: true });
            }}
          >
            合并
          </Button>
          <div className="Merge-github" onClick={() => this.handleBtnGithub()}>
            <GithubOutlined title="访问Github" />
          </div>
        </div>
        <div>
          <Table
            dataSource={fileList}
            columns={[
              {
                title: "",
                dataIndex: "num",
                width: 50,
              },
              {
                title: "文件列表",
                dataIndex: "name",
              },
            ]}
            size="small"
            pagination={false}
            scroll={{ y: 240 }}
            locale={{
              emptyText: "还没有添加文件~",
            }}
          ></Table>
        </div>
        {(fileList.length && (
          <div className="Merge-file-len">共{fileList.length}个文件</div>
        )) ||
          ""}
        <div className="Merge-console">
          <Input.TextArea
            rows={8}
            value={cliContent}
            ref={(_ref) => (this.refConsole = ReactDOM.findDOMNode(_ref))}
          ></Input.TextArea>
        </div>

        <Modal
          title="合并视频"
          visible={showMergeModal}
          onCancel={() => this.setState({ showMergeModal: false })}
          footer={[
            isMerging ? (
              <Button
                type="primary"
                danger
                onClick={() => {
                  this.setState({
                    isMerging: false,
                    showMergeModal: false,
                    progressValue: 0,
                  });
                  message.error("已终止合并");
                  // exit 后，后续无法使用
                  // this.ffmpeg.exit();
                  setTimeout(() => window.location.reload(), 2000);
                }}
              >
                终止合并
              </Button>
            ) : null,
            <Button
              type="primary"
              onClick={() => {
                this.handleMegeBtnClick();
              }}
              loading={isMerging}
            >
              开始合并
            </Button>,
          ]}
        >
          <Input
            // 输出不能中文
            disabled={true}
            onChange={(e) => {
              this.setState({
                outputName: e.target.value,
              });
            }}
            addonAfter={
              <Select
                value={outputExt}
                onChange={(e) => {
                  this.setState({
                    outputExt: e,
                  });
                }}
                disabled={isMerging}
              >
                {SUPORT_INPUT_EXT.map((item) => (
                  <Select.Option value={"." + item}>.{item}</Select.Option>
                ))}
              </Select>
            }
            value={outputName}
          />

          {isMerging ? (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Progress type="circle" percent={progressValue} />
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }
}
